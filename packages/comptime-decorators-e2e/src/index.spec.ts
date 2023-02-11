import { decoratorTransformer, TsCompiler } from "@electric/comptime-decorators"
import * as path from "path"

import * as decorators from "./lib/decorators/comptime"

describe("TsCompiler", () => {
	it("should work", () => {
		// console.log("decorators:", decorators)

		const tsConfigPath = path.resolve(__dirname, "../tsconfig.lib.json")
		const tsc = new TsCompiler(tsConfigPath)
		const transformerFactory = decoratorTransformer(decorators as any)

		const { virtualFs, diagnostics } = tsc.transformAll(transformerFactory)

		for (let diag of diagnostics)
			tsc.reportDiagnostics(diag)

		Array.from(virtualFs.keys())
			.filter(filename => filename.includes("comptime-decorators-e2e"))
			.filter(filename => filename.endsWith("src/index.js"))
			.forEach(filename => {
				const text = virtualFs.get(filename)!
				// console.log(`// ${filename}\n\n${text}`)
				expect(text).toMatchSnapshot()
			})
	})
})
