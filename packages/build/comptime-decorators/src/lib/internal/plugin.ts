import assertType from "@electric/assert-type"
import exists from "@electric/exists"
import match from "@electric/match"
import * as ts from "typescript"
import { SyntaxKind } from "typescript"

import {
	ComptimeDecorator,
	DecoratableNode,
	Decorator,
	DecoratorFactory,
	PluginConfig,
	PluginContext,
	Traversal,
} from "../types"
import { NodeFactory } from "./node-factory"

export class Plugin {
	private _decorators: Record<string, Decorator>
	private _context: PluginContext
	private _nodeFactory = NodeFactory.instance
	private _sourceFile?: ts.SourceFile
	private _traversal: Traversal

	constructor (
		decorators: Record<string, Decorator>,
		config: PluginConfig,
		context: PluginContext,
	) {
		this._decorators = decorators
		this._context = context
		this._traversal = config.traversal
	}

	/** Apply a decorator to a node. */
	decorate<T extends DecoratableNode>(
		node: T,
		decorator: ts.Decorator,
	): ts.VisitResult<ts.Node> {
		let result: ts.VisitResult<ts.Node>

		// Decorator factory, e.g. `@MyDecorator(...)`
		if (ts.isCallExpression(decorator.expression)) {
			const ident = decorator.expression.expression as ts.Identifier
			if (!(ident.text in this._decorators))
				return node

			const args = evalDecoratorArgs(decorator.expression.arguments, this._sourceFile)
			const decoratorFactory = this._decorators[ident.text] as DecoratorFactory<T>
			const decoratorFn = decoratorFactory(...args)

			result = decoratorFn.call(this._context, node, this._nodeFactory)
		}

		// Naked decorator, e.g. `@MyDecorator`
		else {
			const ident = decorator.expression as ts.Identifier
			if (!(ident.text in this._decorators))
				return node

			const decoratorFn = this._decorators[ident.text] as ComptimeDecorator<T>
			result = decoratorFn.call(this._context, node, this._nodeFactory)
		}

		// Strip the processed decorator from the transformed node
		if (!result) return result
		if (Array.isArray(result)) {
			const decorated = result.find(n => NodeFactory.updated.has(n))
			if (!decorated) return result

			const stripped = stripDecorator(decorated as DecoratableNode, decorator)
			const idx = result.indexOf(decorated)
			result.splice(idx, 1, stripped)

			return result
		}

		return stripDecorator(result as DecoratableNode, decorator)
	}

	/**
	 * Recursively walk all child nodes of `parent`, applying decorators where
	 * applicable.
	 */
	walk<T extends ts.Node>(parent: T, sourceFile: ts.SourceFile): T {
		this._sourceFile = sourceFile

		return ts.visitEachChild(parent, node => {
			if (!isDecoratable(node))
				return this.walk(node, sourceFile)

			const decorators = ts.getDecorators(node)?.slice().reverse()
			if (!decorators)
				return this.walk(node, sourceFile)

			if (
				ts.isClassDeclaration(node)
				&& this._traversal === Traversal.Postorder
			) {
				// Walk children first
				const result = this.walk(node, sourceFile)

				// Decorate the result node
				return this.processDecorators(decorators, result)
			}

			// Apply each decorator to the node
			const result = this.processDecorators(decorators, node)
			if (!result) return result

			// If processing the decorator stack resulted in multiple nodes,
			// walk each of them
			if (Array.isArray(result))
				return result.flatMap(child => this.walk(child, sourceFile))

			// Walk the processed child node
			return this.walk(result, sourceFile)
		}, this._context.transformContext)
	}

	processDecorators<T extends DecoratableNode>(decorators: ts.Decorator[], node: T) {
		return decorators.reduce<ts.VisitResult<ts.Node>>((accum, dec) => {
			if (!accum) return accum
			if (Array.isArray(accum)) {
				// If this is an array, it means the original node has already
				// been processed by a decorator which returned multiple nodes.
				// Additional decorators should be applied to that original
				// decorated node, but not to the added ones.
				return accum
					.flatMap(n => {
						if (NodeFactory.updated.has(n))
							return this.decorate(n as DecoratableNode, dec)

						return n
					})
					.filter(exists)
			}

			return this.decorate(accum as DecoratableNode, dec)
		}, node)
	}
}

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
}

function isDecoratable(node: unknown): node is DecoratableNode {
	return (
		ts.isClassDeclaration(node as ts.Node)
		|| ts.isMethodDeclaration(node as ts.Node)
		|| ts.isPropertyDeclaration(node as ts.Node)
	)
}

type Literal
	= string
	| number
	| RegExp
	| bigint
	| boolean
	| null
	| undefined
	| Literal[]
	| { [key: string]: Literal }

/**
 * Evaluate literal expressions passed to a decorator factory so that we can
 * invoke the factory with the correct arguments.
 *
 * TODO: Currently this _only_ supports literals, but we should theoretically be
 * able to support any constant, statically-known value.
 */
function evalDecoratorArgs(
	args: readonly ts.Expression[],
	sourceFile?: ts.SourceFile,
): Literal[] {
	return args.map(arg => evalLiteralExpression(arg, sourceFile))
}

function evalLiteralExpression(expr: ts.Expression, sourceFile?: ts.SourceFile): Literal {
	type LiteralKind
		= SyntaxKind.StringLiteral
		| SyntaxKind.NoSubstitutionTemplateLiteral
		| SyntaxKind.NumericLiteral
		| SyntaxKind.BigIntLiteral
		| SyntaxKind.RegularExpressionLiteral
		| SyntaxKind.TrueKeyword
		| SyntaxKind.FalseKeyword
		| SyntaxKind.NullKeyword
		| SyntaxKind.UndefinedKeyword
		| SyntaxKind.ArrayLiteralExpression
		| SyntaxKind.ObjectLiteralExpression

	if (!(
		ts.isLiteralExpression(expr)
		|| expr.kind === SyntaxKind.TrueKeyword
		|| expr.kind === SyntaxKind.FalseKeyword
		|| expr.kind === SyntaxKind.NullKeyword
		|| expr.kind === SyntaxKind.ArrayLiteralExpression
		|| expr.kind === SyntaxKind.ObjectLiteralExpression
		|| (
			ts.isIdentifier(expr) && expr.text === "undefined"
		)
	)) {
		throw new Error(
			`Arguments passed to compile-time decorators must be literals; found ${
				SyntaxKind[expr.kind]
			}: \`${
				expr.getText(sourceFile)
			}\``
		)
	}

	const lit = expr as unknown as ts.LiteralLikeNode

	return match(expr.kind as LiteralKind, {
		[SyntaxKind.StringLiteral]: () => lit.text,
		[SyntaxKind.NoSubstitutionTemplateLiteral]: () => lit.text,
		[SyntaxKind.NumericLiteral]: () => parseFloat(lit.text),
		[SyntaxKind.BigIntLiteral]: () => BigInt(lit.text.substring(0, lit.text.length - 1)),
		[SyntaxKind.RegularExpressionLiteral]: () => parseRegExpLiteral(lit.text),
		[SyntaxKind.TrueKeyword]: () => true,
		[SyntaxKind.FalseKeyword]: () => false,
		[SyntaxKind.NullKeyword]: () => null,
		[SyntaxKind.UndefinedKeyword]: () => undefined,
		[SyntaxKind.Identifier]: () => undefined, // NOTE: This has already been checked above
		[SyntaxKind.ArrayLiteralExpression]: () =>
			(expr as ts.ArrayLiteralExpression)
				.elements
				.map(it => evalLiteralExpression(it, sourceFile)),
		[SyntaxKind.ObjectLiteralExpression]: () =>
			evalObjectLiteral(expr as ts.ObjectLiteralExpression, sourceFile),
	})
}

function parseRegExpLiteral(text: string) {
	const endIdx = text.lastIndexOf("/")
	const flags = text.substring(endIdx + 1)
	const src = text.substring(1, endIdx)

	return new RegExp(src, flags)
}

function evalObjectLiteral(expr: ts.ObjectLiteralExpression, sourceFile?: ts.SourceFile) {
	return expr.properties.reduce((accum, element) => {
		if (!ts.isPropertyAssignment(element))
			throw new Error(
				`Properties of an object literal passed to a compile-time decorator ` +
				`must be literals; found ${SyntaxKind[element.kind]}: \`${
					element.getText(sourceFile)
				}\``
			)

		const propName = element.name
		if (
			!ts.isIdentifier(propName)
			&& !ts.isStringLiteral(propName)
			&& !ts.isNumericLiteral(propName)
		)
			throw new Error(
				`Property keys of an object literal passed to a compile-time decorator ` +
				`must be literal strings or numbers; found ${
					SyntaxKind[element.name.kind]
				}: \`${
					element.name.getText(sourceFile)
				}\``
			)

		accum[propName.text] = evalLiteralExpression(element.initializer, sourceFile)

		return accum
	}, {} as { [key: string]: Literal })
}

/** Remove the matching `decorator` from `node`. */
function stripDecorator<T extends DecoratableNode>(
	node: T,
	decorator: ts.Decorator,
): T {
	const modifiers = node.modifiers?.filter(mod => mod !== decorator)

	return match(node.kind, {
		[SyntaxKind.ClassDeclaration]: () => {
			assertType<ts.ClassDeclaration>(node)
			return NodeFactory.instance.updateClassDecl(
				node,
				modifiers,
				node.name,
				node.typeParameters,
				node.heritageClauses,
				node.members
			) as T
		},
		[SyntaxKind.MethodDeclaration]: () => {
			assertType<ts.MethodDeclaration>(node)
			return NodeFactory.instance.updateMethodDecl(
				node,
				modifiers,
				node.asteriskToken,
				node.name,
				node.questionToken,
				node.typeParameters,
				node.parameters,
				node.type,
				node.body
			) as T
		},
		[SyntaxKind.PropertyDeclaration]: () => {
			assertType<ts.PropertyDeclaration>(node)
			return NodeFactory.instance.updatePropertyDecl(
				node,
				modifiers,
				node.name,
				node.questionToken ?? node.exclamationToken,
				node.type,
				node.initializer
			) as T
		},
	})
}
