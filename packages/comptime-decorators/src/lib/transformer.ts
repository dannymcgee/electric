import * as ts from "typescript"
import { NodeFactory } from "./types";

export const NODE_FACTORY = Object
	.keys(ts.factory)
	.filter(key => key.startsWith("create"))
	.reduce((mod, verboseKey) => {
		const key = verboseKey.replace(/^create/, "")
		;(mod as any)[key] = (ts.factory as any)[verboseKey]

		return mod
	}, {} as NodeFactory)

export function transformerFactory(program: ts.Program): ts.TransformerFactory<ts.SourceFile> {
	return (context) => {
		return (sourceFile) => {
			return ts.visitEachChild(sourceFile, (node) => {
				return node
			}, context)
		}
	}
}
