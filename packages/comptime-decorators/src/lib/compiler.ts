import exists from "@electric/exists";
import * as path from "path"
import * as ts from "typescript"

// TODO: This doesn't really belong in this library
export class TsCompiler {
	program: ts.Program
	sourceFiles: ts.SourceFile[]

	constructor (tsConfigPath: string) {
		const { fileNames, options } = this.resolveConfig(tsConfigPath)

		this.program = ts.createProgram(fileNames, options)
		this.sourceFiles = fileNames
			.map(file => this.program.getSourceFile(file))
			.filter(exists)
	}

	transformAll(factory: ProgramTransformerFactory) {
		const transformer = factory(this.program)
		const virtualFs = new Map<string, string>()
		const { diagnostics } = emit(this.program, {
			writeFile: (filename, text) => {
				virtualFs.set(filename, text)
			},
			customTransformers: {
				before: [transformer],
			},
		})

		return { virtualFs, diagnostics }
	}

	reportDiagnostics(diag: ts.Diagnostic): void
	reportDiagnostics(diag: ts.Diagnostic, options: { shouldThrow: false }): void
	reportDiagnostics(diag: ts.Diagnostic, options: { shouldThrow: true }): never

	reportDiagnostics(diag: ts.Diagnostic, { shouldThrow } = { shouldThrow: false }) {
		const msg = ts.flattenDiagnosticMessageText(diag.messageText, "\n", 2)
		console.log(msg)

		if (shouldThrow)
			throw new Error()
	}

	resolveConfig(tsConfigPath: string) {
		const parseHost = ts.sys
		const jsonSrc = parseHost.readFile(tsConfigPath)
		if (!jsonSrc)
			throw new Error(`Failed to read config file at "${tsConfigPath}"`)

		const { config, error } = ts.parseConfigFileTextToJson(tsConfigPath, jsonSrc)
		if (error)
			this.reportDiagnostics(error, { shouldThrow: true })

		const basePath = path.dirname(tsConfigPath)
		const {
			fileNames,
			options,
			errors,
		} = ts.parseJsonConfigFileContent(config, parseHost, basePath)

		if (errors.length) {
			for (let error of errors)
				this.reportDiagnostics(error)

			throw new Error()
		}

		return { fileNames, options }
	}
}

interface EmitOptions {
	targetSourceFile?: ts.SourceFile
	writeFile?: ts.WriteFileCallback
	cancellationToken?: ts.CancellationToken
	emitOnlyDtsFiles?: boolean
	customTransformers?: ts.CustomTransformers
}

// JavaScript really needs named arguments
function emit(program: ts.Program, {
	targetSourceFile,
	writeFile,
	cancellationToken,
	emitOnlyDtsFiles,
	customTransformers,
}: EmitOptions): ts.EmitResult {
	return program.emit(
		targetSourceFile,
		writeFile,
		cancellationToken,
		emitOnlyDtsFiles,
		customTransformers,
	)
}

export interface ProgramTransformerFactory {
	(program: ts.Program): ts.TransformerFactory<ts.SourceFile>
}
