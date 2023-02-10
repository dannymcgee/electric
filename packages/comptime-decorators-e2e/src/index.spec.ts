import { transformerFactory, TsCompiler } from "@electric/comptime-decorators"
import * as path from "path"

describe("TsCompiler", () => {
	it("should work", () => {
		const tsConfigPath = path.resolve(__dirname, "../tsconfig.lib.json")
		const tsc = new TsCompiler(tsConfigPath)
		tsc.transformAll(transformerFactory)
	})
})
