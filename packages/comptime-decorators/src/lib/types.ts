import * as ts from "typescript"

export interface ComptimeDecorator<T extends ts.Node> {
	(this: PluginContext, node: T): T
}

export type ClassDecorator = ComptimeDecorator<ts.ClassDeclaration>
export type MethodDecorator = ComptimeDecorator<ts.MethodDeclaration>
export type PropertyDecorator = ComptimeDecorator<ts.PropertyDeclaration>

type PluginContext
	= ts.Program
	& ts.TransformationContext

export type NodeFactory = {
	[K in keyof ts.NodeFactory as BriefNodeFactoryKey<K>]: ts.NodeFactory[K]
}

type BriefNodeFactoryKey<K>
	= K extends `create${infer S}`
		? S : never
