import { Injectable } from "@angular/core";
import { match } from "@electric/utils";
import { fs, path } from "@tauri-apps/api";
import { loadWASM, OnigScanner, OnigString } from "vscode-oniguruma";
import { IGrammar, INITIAL, IOnigLib, IToken, Registry } from "vscode-textmate";

@Injectable({
	providedIn: "root",
})
export class Highlighter {
	private _registry = this.createRegistry();

	async highlightElement(element: HTMLElement, language: string) {
		try {
			const src = element.textContent;
			if (!src) return;

			const scope = this.getScopeName(language);
			const grammar = await this._registry.loadGrammar(scope);
			if (!grammar) return;

			const tokens = this.tokenizeTextBlock(src, grammar);
			const html = this.buildHtmlForTokens(src, tokens);

			element.innerHTML = html;
		}
		catch (err) {
			console.warn(err);
			return;
		}
	}

	// TextMate grammars are designed to work one line at a time, so we tokenize
	// each line while accumulating the start/end offsets so we can index back
	// into the full code block's source text to get the lexeme for each token.
	private tokenizeTextBlock(src: string, grammar: IGrammar): IToken[] {
		return src
			.split("\n")
			.reduce((accum, line, idx, lines) => {
				let lineStart = accum.lineStart;
				if (idx > 0) {
					lineStart += lines[idx - 1].length + 1;
				}

				const result = grammar.tokenizeLine(line, accum.ruleStack);
				const tokens = result.tokens.slice();
				for (let token of tokens) {
					token.startIndex += lineStart;
					(token as any).endIndex += lineStart;
				}

				return {
					lineStart,
					ruleStack: result.ruleStack,
					tokens: accum.tokens.concat(tokens),
				};
			}, {
				lineStart: 0,
				ruleStack: INITIAL,
				tokens: [] as IToken[],
			})
			.tokens;
	}

	// VS Code's implementation is much fancier than this (likely for
	// performance). This is roughly what they do (judging purely by the end
	// result):
	//  - Create a unique CSS class for every combination of color, font-weight,
	//    and font-style specified by the active theme
	//  - Look up which rule should apply for a given text range's scopes
	//  - Wrap the text range in a span with the correct class
	//
	// What we do instead is dirt simple: Apply the TextMate scopes as 1:1 CSS
	// classes, and use CSS to style them.
	//
	// In other words, if a text range has the TextMate scopes
	// `punctuation.definition.string.begin.cpp`, we wrap that text range in a
	// `<span class="punctuation definition string begin cpp" />`.
	//
	// This is plenty fast enough for this app's use cases and allows styling
	// directly in CSS, which is both way easier and way more flexible.
	private buildHtmlForTokens(src: string, tokens: IToken[]): string {
		return tokens.reduce((accum, token, idx) => {
			let html = accum.html;

			// Close tags for any scopes that ended at the previous token
			for (let scope of accum.scopes)
				if (!token.scopes.includes(scope))
					html += "</span>";

			// Insert any unscoped source text that exists between the tokens
			// (Generally just newline characters)
			if (accum.prevToken && accum.prevToken.endIndex < token.startIndex)
				html += src.substring(accum.prevToken.endIndex, token.startIndex);

			// Open a new tag for every scope that starts at this token
			for (let scope of token.scopes)
				if (!accum.scopes.includes(scope))
					html += `<span class="${scope.replace(/\./g, " ")}">`;

			// Insert the text range for the current token
			html += src.substring(token.startIndex, token.endIndex);

			// If this is the last token in the array, close any tags that are
			// still open
			if (idx === tokens.length - 1)
				for (let _ of token.scopes)
					html += "</span>";

			return {
				prevToken: token,
				scopes: token.scopes,
				html,
			};
		}, {
			prevToken: null as IToken | null,
			scopes: [] as string[],
			html: "",
		})
		.html;
	}

	private getScopeName(lang: string): string {
		return match(lang, {
			antlr4: () => "source.antlr",
			bash: () => "source.shell",
			cmake: () => "source.cmake",
			cpp: () => "source.cpp",
			groovy: () => "source.groovy",
			java: () => "source.java",
			kotlin: () => "source.kotlin",
			_: () => "",
		});
	}

	private createRegistry(): Registry {
		return new Registry({
			onigLib: this.loadOnig(),
			loadGrammar: async (scope: string) => {
				const module_ = await match(scope, {
					"source.antlr": () => import("./languages/antlr4.tmLanguage.json"),
					"source.cmake": () => import("./languages/cmake.tmLanguage.json"),
					"source.cpp": () => import("./languages/cpp.tmLanguage.json"),
					"source.groovy": () => import("./languages/groovy.tmLanguage.json"),
					"source.java": () => import("./languages/java.tmLanguage.json"),
					"source.shell": () => import("./languages/shell-unix-bash.tmLanguage.json"),
					"source.kotlin": () => import("./languages/kotlin.tmLanguage.json"),
					_: () => null,
				}) as any;

				return module_?.default;
			},
		});
	}

	private async loadOnig(): Promise<IOnigLib> {
		const __dirname = new URL(import.meta.url).pathname.replace(/^\//, "");
		const wasmPath = await path.resolve(
			__dirname,
			"../../../../../../../node_modules/vscode-oniguruma/release/onig.wasm",
		);
		const wasmBin = await fs.readBinaryFile(wasmPath);

		await loadWASM(wasmBin);

		return {
			createOnigScanner: sources => new OnigScanner(sources),
			createOnigString: str => new OnigString(str),
		}
	}
}
