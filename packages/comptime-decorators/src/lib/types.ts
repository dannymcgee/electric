import * as ts from "typescript"

/**
 * Function signature for a compile-time decorator.
 *
 * Returning the original node leaves it unmodified. Returning a new or modified
 * node (or array of nodes) substitutes the original node for the return value.
 * Returning `undefined` removes the node from the tree.
 */
export interface ComptimeDecorator<T extends DecoratableNode> {
	(this: PluginContext, node: T, $: NodeFactory): ts.VisitResult<ts.Node>
}

export type DecoratorFactory
	= Fn<any[], ComptimeDecorator<DecoratableNode>>

export type Decorator
	= ComptimeDecorator<DecoratableNode>
	| DecoratorFactory

export type DecoratableNode
	= ts.ClassDeclaration
	| ts.MethodDeclaration
	| ts.PropertyDeclaration

export type ClassDecorator = ComptimeDecorator<ts.ClassDeclaration>
export type MethodDecorator = ComptimeDecorator<ts.MethodDeclaration>
export type PropertyDecorator = ComptimeDecorator<ts.PropertyDeclaration>

/** The `this` context for compile-time decorators. */
export interface PluginContext extends ts.TransformationContext {
	program: ts.Program
	typeChecker: ts.TypeChecker
}

export type NodeFactory = {
	[K in keyof ts.NodeFactory as BriefNodeFactoryKey<K>]: ts.NodeFactory[K]
}

/**
 * Chops down `NodeFactory` creation method names to reasonable lengths.
 * E.g.:
 *    `createClassStaticBlockDeclaration`
 * => `ClassStaticBlockDecl`
 */
type BriefNodeFactoryKey<K>
	= K extends `create${infer S}`
		? S extends `${infer T}Declaration` ? `${T}Decl`
		: S extends `${infer T}Statement`   ? `${T}Stmt`
		: S extends `${infer T}Expression`  ? `${T}Expr`
		: S
	: K extends `update${any}`
		? K extends `${infer T}Declaration` ? `${T}Decl`
		: K extends `${infer T}Statement`   ? `${T}Stmt`
		: K extends `${infer T}Expression`  ? `${T}Expr`
		: K
	: never

interface Fn<Args extends unknown[], R> {
	(...args: Args): R
}
