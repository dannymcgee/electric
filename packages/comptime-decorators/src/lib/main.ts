import * as ts from "typescript"

import { Decorator } from "./types"
import { Plugin } from "./internal/plugin"

export default function (decorators: Record<string, Decorator>) {
	return (program: ts.Program): ts.TransformerFactory<ts.SourceFile> => {
		const typeChecker = program.getTypeChecker()

		return (context) => {
			const plugin = new Plugin(decorators, {
				...context,
				program,
				typeChecker,
			})

			return sourceFile => plugin.walk(sourceFile, sourceFile)
		}
	}
}
