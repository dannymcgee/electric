import * as ts from "typescript"

/**
 * Function signature for a compile-time decorator.
 *
 * Returning the original node leaves it unmodified. Returning a new or modified
 * node (or array of nodes) substitutes the original node for the return value.
 * Returning `undefined` removes the node from the tree.
 */
export interface ComptimeDecorator<
	T extends DecoratableNode = DecoratableNode,
	U = any
> {
	(this: PluginContext<U>, node: T, $: NodeFactory): ts.VisitResult<ts.Node>
}

export interface DecoratorFactory<
	T extends DecoratableNode,
	U = any
> {
	(...args: any[]): ComptimeDecorator<T, U>
}

export type Decorator<T extends DecoratableNode = DecoratableNode, U = any>
	= ComptimeDecorator<T, U>
	| DecoratorFactory<T, U>

export type DecoratableNode
	= ts.ClassDeclaration
	| ts.MethodDeclaration
	| ts.PropertyDeclaration

export type ClassDecorator<U = undefined> = ComptimeDecorator<ts.ClassDeclaration, U>
export type MethodDecorator<U = undefined> = ComptimeDecorator<ts.MethodDeclaration, U>
export type PropertyDecorator<U = undefined> = ComptimeDecorator<ts.PropertyDeclaration, U>

/** The `this` context for compile-time decorators. */
export interface PluginContext<U = any> {
	/** Context for the TypeScript transformation */
	transformContext: ts.TransformationContext
	/** The TypeScript program being operated on */
	program: ts.Program
	/** The TypeScript TypeChecker for the program being operated on */
	typeChecker: ts.TypeChecker
	/**
	 * A property for the user to store arbitrary data/context for their own
	 * purposes. Initialized to `undefined` when the transformation process
	 * begins. Any changes the user makes to the contents of this property will
	 * persist across decorator invocations. This can be used to allow decorator
	 * implementations to share information with one another.
	 */
	userContext: U
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
