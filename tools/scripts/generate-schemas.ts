import chalk from "chalk";
import { promises as fs } from "fs";
import path from "path";
import ts, { SyntaxKind } from "typescript";

interface AsyncFn<Args extends any[], R = void> {
	(...args: Args): Promise<R>;
}

(async function () {
	let executorsDir = path.join(process.cwd(), "tools/executors");
	try {
		await walk(executorsDir, async pathname => {
			let stats = await fs.stat(pathname);
			if (stats.isDirectory()) return true;

			if (path.basename(pathname) === "schema.d.ts") {
				await new Transpiler(pathname)
					.build()
					.emit(pathname.replace(/\.d\.ts$/, ".json"));
			}

			return false;
		});

		logSuccess("Generated JSON schemas");
	}
	catch (err) {
		logError(err);
	}
})();

async function walk(parent: string, visit: AsyncFn<[string], boolean>) {
	let childNames = await fs.readdir(parent);
	let children = childNames.map(child => path.join(parent, child));

	await Promise.all(children.map(async child => {
		if (await visit(child)) {
			await walk(child, visit);
		}
	}));
}

function logSuccess(msg: string) {
	console.log(`${chalk.bold.cyan.inverse(" DONE ")} ${msg}`);
}

function logError(err: Error): never {
	console.log(`${chalk.bold.redBright.inverse(" ERROR ")} ${err.message}`);
	if (err.stack) {
		console.log(chalk.red(err.stack.split("\n").slice(1).join("\n")));
	}
	process.exit(1);
}

class Transpiler {
	private result = {
		$schema: "http://json-schema.org/schema" as const,
		cli: "nx" as const,
		type: "object" as const,
		properties: {} as Record<string, any>,
		required: [] as string[],
	};
	private program: ts.Program;
	private srcFile: ts.SourceFile;

	constructor (schemaPath: string) {
		this.program = ts.createProgram({
			rootNames: [schemaPath],
			options: {},
		});

		let srcFile = this.program.getSourceFile(schemaPath);
		if (!srcFile) throw new Error("Failed to get source file");
		this.srcFile = srcFile;
	}

	build() {
		this.walk(this.srcFile);
		return this;
	}

	async emit(outPath: string) {
		let json = JSON.stringify(this.result, null, "\t");
		await fs.writeFile(outPath, json);
	}

	private walk(parent: ts.Node) {
		ts.forEachChild(parent, child => {
			if (this.visitNode(child)) {
				this.walk(child);
			}
		})
	}

	private visitNode(node: ts.Node): boolean {
		// this.logNode(node);
		switch (node.kind) {
			case SyntaxKind.InterfaceDeclaration:
				return this.visitIfaceDecl(node as ts.InterfaceDeclaration);
			case SyntaxKind.PropertySignature:
				return this.visitPropSig(node as ts.PropertySignature);
		}

		return false;
	}

	private visitIfaceDecl(node: ts.InterfaceDeclaration): boolean {
		if (node.name.text === "Options")
			return true;
		return false;
	}

	private visitPropSig(node: ts.PropertySignature): boolean {
		let name = node.name.getText(this.srcFile);
		let desc = {} as any;

		let triviaWidth = node.getLeadingTriviaWidth(this.srcFile);
		let trivia = node.getFullText(this.srcFile).substring(0, triviaWidth);
		if (trivia) {
			let meta = this.parseJsDoc(trivia);
			for (let [key, value] of Object.entries(meta)) {
				if (key === "required") {
					this.result.required.push(name);
				} else {
					desc[key] = value;
				}
			}
		}

		if (node.type) {
			let ty = node.type.getText(this.srcFile);
			switch (ty) {
				case "string":
				case "number":
				case "boolean": {
					desc.type = ty;
					break;
				}
				// TODO: arrays, enums, etc.
			}
		}
		this.result.properties[name] = desc;

		return false;
	}

	private parseJsDoc(trivia: string) {
		let commentLines = trivia
			.split("\n")
			.map(l => l
				.replace(/^\s*\/?\**\/?/, "")
				.replace(/\*+\/\s*$/, "")
				.trim()
			)
			.filter(Boolean);

		let result = {} as Record<string, string>;
		let currentTag = "description";
		let currentText = [] as string[];

		for (let line of commentLines) {
			if (line.startsWith("@")) {
				let tag = line.match(/^@(\w+)/)![1]!;

				if (tag.length > line.length) {
					line = line.substring(tag.length + 1);
				}
				if (currentText.length) {
					result[currentTag] = currentText.join(" ");
				}
				currentTag = tag;
			}
			currentText.push(line);
		}

		if (currentText.length) {
			result[currentTag] = currentText.join(" ");
		}

		return result;
	}

	private logNode(node: ts.Node) {
		let displayKind = SyntaxKind[node.kind];
		let text = node.getText(this.srcFile);

		if (text.length > 80) {
			text = `${text.substring(0, 80)}...`;
		}

		if (text.includes("\n")) {
			let end = text.indexOf("\n");
			text = text.substring(0, end);
		}

		console.log(`[${displayKind}] ${text}`);
	}
}
