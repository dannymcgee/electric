import exists from "@electric/exists"
import match from "@electric/match"
import assertType from "@electric/assert-type"
import * as ts from "typescript"
import { SyntaxKind } from "typescript"

import {
	ComptimeDecorator,
	DecoratableNode,
	Decorator,
	DecoratorFactory,
	NodeFactory as INodeFactory,
	PluginContext,
} from "./types";

type ReadonlyWeakSet<T extends object>
	= Pick<WeakSet<T>, "has">

class NodeFactory {
	private static _instance: INodeFactory
	static get instance() {
		return this._instance ??= new NodeFactory() as unknown as INodeFactory
	}

	private _updated = new WeakSet<ts.Node>()
	static get updated(): ReadonlyWeakSet<ts.Node> {
		return (this.instance as unknown as NodeFactory)._updated
	}

	private _created = new WeakSet<ts.Node>()
	static get created(): ReadonlyWeakSet<ts.Node> {
		return (this.instance as unknown as NodeFactory)._created
	}

	private constructor () {
		for (let verboseKey of Object.keys(ts.factory)) {
			const key = verboseKey
				.replace(/^create/, "")
				.replace(/Declaration$/, "Decl")
				.replace(/Statement$/, "Stmt")
				.replace(/Expression$/, "Expr")

			if (verboseKey.startsWith("create")) {
				this.constructor.prototype[key] = (...args: any[]): any => {
					const result = (ts.factory as any)[verboseKey](...args)
					this._created.add(result)
					return result
				}
			}
			else if (verboseKey.startsWith("update")) {
				this.constructor.prototype[key] = (...args: any[]): any => {
					const result = (ts.factory as any)[verboseKey](...args)
					this._updated.add(result)
					return result
				}
			}
			else {
				this.constructor.prototype[key] = (ts.factory as any)[verboseKey]
			}
		}
	}
}

export function decoratorTransformer(decorators: Record<string, Decorator>) {
	return (program: ts.Program): ts.TransformerFactory<ts.SourceFile> => {
		const typeChecker = program.getTypeChecker()

		return (context) => {
			const pluginContext = {
				...context,
				program,
				typeChecker,
			}

			// Note: `decorate` and `walk` are declared in this scope because they
			// capture `pluginContext`. These could be refactored to be returned
			// from a simple factory at the top level that takes `pluginContext` as
			// a parameter. Would save two levels of indentation at the cost of
			// some extra indirection, but might be worth it eventually.

			function decorate<T extends DecoratableNode>(
				node: T,
				dec: ts.Decorator,
				sourceFile: ts.SourceFile,
			) {
				if (ts.isCallExpression(dec.expression)) {
					const ident = dec.expression.expression as ts.Identifier
					if (!(ident.text in decorators))
						return node

					const args = evalDecoratorArgs(dec.expression.arguments, sourceFile)
					const decoratorFactory = decorators[ident.text] as DecoratorFactory
					const decoratorFn = decoratorFactory(...args)

					return decoratorFn.call(pluginContext, node, NodeFactory.instance)
				}

				const ident = dec.expression as ts.Identifier
				if (!(ident.text in decorators))
					return node

				const decoratorFn = decorators[ident.text] as ComptimeDecorator<DecoratableNode>
				return decoratorFn.call(pluginContext, node, NodeFactory.instance)
			}

			function walk<T extends ts.Node>(parent: T, sourceFile: ts.SourceFile): T {
				return ts.visitEachChild(parent, child => {
					if (!(
						ts.isClassDeclaration(child)
						|| ts.isMethodDeclaration(child)
						|| ts.isPropertyDeclaration(child)
					)) {
						return walk(child, sourceFile)
					}

					const decorators = ts.getDecorators(child)?.slice().reverse()
					if (!decorators) {
						return walk(child, sourceFile)
					}

					const result = decorators.reduce<ts.VisitResult<ts.Node>>((accum, dec) => {
						if (!accum) return accum
						if (Array.isArray(accum)) {
							// If this is an array, it means the original node has
							// already been processed by a decorator which returned
							// multiple nodes. Additional decorators shuold be applied
							// to that original decorated node, but not to the added
							// ones.
							return accum
								.flatMap(n => {
									if (NodeFactory.updated.has(n))
										return decorate(
											stripDecorator.call(pluginContext, n as DecoratableNode, dec),
											dec,
											sourceFile
										)

									return n
								})
								.filter(exists)
						}

						return decorate(
							stripDecorator.call(pluginContext, accum as DecoratableNode, dec),
							dec,
							sourceFile
						)
					}, child)

					if (!result) return result
					if (Array.isArray(result))
						return result.flatMap(child => walk(child, sourceFile))

					return walk(result, sourceFile)
				}, context)
			}

			return sourceFile => walk(sourceFile, sourceFile)
		}
	}
}

type Literal
	= string
	| number
	| RegExp
	| bigint
	| boolean
	| null
	| undefined

function evalDecoratorArgs(
	args: readonly ts.Expression[],
	sourceFile: ts.SourceFile,
): Literal[] {
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
		// | ts.SyntaxKind.ArrayLiteralExpression // TODO
		// | ts.SyntaxKind.ObjectLiteralExpression // TODO

	return args.map(arg => {
		if (!(
			ts.isLiteralExpression(arg)
			|| arg.kind === SyntaxKind.TrueKeyword
			|| arg.kind === SyntaxKind.FalseKeyword
			|| arg.kind === SyntaxKind.NullKeyword
			|| arg.kind === SyntaxKind.UndefinedKeyword
		)) {
			throw new Error(
				`Arguments passed to compile-time decorators must be literals; found: \`${
					arg.getText(sourceFile)
				}\``
			)
		}

		const expr = arg as unknown as ts.LiteralLikeNode

		return match(expr.kind as LiteralKind, {
			[SyntaxKind.StringLiteral]: () => expr.text,
			[SyntaxKind.NoSubstitutionTemplateLiteral]: () => expr.text,
			[SyntaxKind.NumericLiteral]: () => parseFloat(expr.text),
			[SyntaxKind.BigIntLiteral]: () => BigInt(expr.text.substring(0, expr.text.length - 1)),
			[SyntaxKind.RegularExpressionLiteral]: () => parseRegExpLiteral(expr.text),
			[SyntaxKind.TrueKeyword]: () => true,
			[SyntaxKind.FalseKeyword]: () => false,
			[SyntaxKind.NullKeyword]: () => null,
			[SyntaxKind.UndefinedKeyword]: () => undefined,
		})
	})
}

function parseRegExpLiteral(text: string) {
	const endIdx = text.lastIndexOf("/")
	const flags = text.substring(endIdx + 1)
	const src = text.substring(1, endIdx)

	return new RegExp(src, flags)
}

function stripDecorator<T extends DecoratableNode>(
	this: PluginContext,
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
