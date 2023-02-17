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

	/** Returns the original, unmodified version of the given node. */
	original(node: ts.Node): ts.Node

	/** Get the type of the provided node if available. */
	getType(node: ts.Node): ts.Type | null
}

// NOTE: Zero-width whitespace characters (U+200B) are placed before and after
// each at-symbol in the JSDoc example to prevent VS Code from mangling the
// rendered tooltips by treating them as JSDoc tags.
/**
 * Configures the order in which decorators are applied to nodes.
 *
 * Note that regardless of the configured order, multiple decorators on a single
 * node will _always_ be applied in reverse order for consistency with the
 * JavaScript specification. For example, given the following declaration:
 *
 * ```typescript
 * ‌​@​third ​@​second ​@​first class Foo {}
 * ```
 *
 * * `first` will be applied to the original `Foo` declaration node
 * * `second` will be applied to the `first`-modified `Foo` node
 * * `third` will be applied to the `first`- and `second`-modified `Foo` node
 *
 * @see {@linkcode Traversal.Preorder}
 * @see {@linkcode Traversal.Postorder}
 */
export enum Traversal {
	/**
	 * Decorators on parent nodes are applied before decorators on their
	 * children. In other words, decorators will be applied in roughly the same
	 * order as they appear in the code.
	 */
	Preorder = "preorder",
	/**
	 * Decorators on child nodes are applied before decorators on their parent.
	 * This is roughly consistent with the JavaScript specification and is the
	 * default mode if not overriden.
	 */
	Postorder = "postorder",
}

export interface PluginConfig {
	/**
	 * Configures the order in which decorators are applied.
	 * @see {@linkcode Traversal}
	 */
	traversal: Traversal
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
