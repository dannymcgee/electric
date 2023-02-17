import * as ts from "typescript"

import { PluginContext } from "../types"

type PluginContextConfig = {
	[K in keyof PluginContext as NonFnKey<PluginContext, K>]: PluginContext[K]
}

type NonFnKey<T, K extends keyof T>
	= T[K] extends (...args: any[]) => any
		? never
		: K

export class PluginContextImpl implements PluginContext {
	program!: ts.Program
	transformContext!: ts.TransformationContext
	typeChecker!: ts.TypeChecker
	userContext: any = undefined

	constructor (context: PluginContextConfig) {
		Object.assign(this, context)
	}

	original(node: ts.Node): ts.Node {
		return ts.getParseTreeNode(node) ?? node
	}

	getType(node: ts.Node): ts.Type | null {
		return this.typeChecker.getTypeAtLocation(node)
	}
}
