import match from "@electric/match"
import assertType from "@electric/assert-type"
import * as ts from "typescript"
import { SyntaxKind } from "typescript"

import {
	ComptimeDecorator,
	DecoratableNode,
	Decorator,
	DecoratorFactory,
	NodeFactory,
	PluginContext,
} from "./types";

export const NODE_FACTORY = Object
	.keys(ts.factory)
	.reduce((mod, verboseKey) => {
		const key = verboseKey
			.replace(/^create/, "")
			.replace(/Declaration$/, "Decl")
			.replace(/Statement$/, "Stmt")
			.replace(/Expression$/, "Expr")

		;(mod as any)[key] = (ts.factory as any)[verboseKey]

		return mod
	}, {} as NodeFactory)

export function decoratorTransformer(decorators: Record<string, Decorator>) {
	return (program: ts.Program): ts.TransformerFactory<ts.SourceFile> => {
		const typeChecker = program.getTypeChecker()

		return (context) => {
			const pluginContext = {
				...context,
				program,
				typeChecker,
			}

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

					return decoratorFn.call(pluginContext, node, NODE_FACTORY)
				}

				const ident = dec.expression as ts.Identifier
				if (!(ident.text in decorators))
					return node

				const decoratorFn = decorators[ident.text] as ComptimeDecorator<DecoratableNode>
				return decoratorFn.call(pluginContext, node, NODE_FACTORY)
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

					const decorators = ts.getDecorators(child)
					if (!decorators) {
						return walk(child, sourceFile)
					}

					const result = decorators.reduce<ts.VisitResult<ts.Node>>((accum, dec) => {
						if (!accum) return accum
						if (Array.isArray(accum)) {
							// TODO: Apply decorators to the original / modified
							// node, while passing any added nodes through.
							// Need a way to identify which is the original.
							return accum
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
			return NODE_FACTORY.updateClassDecl(
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
			return NODE_FACTORY.updateMethodDecl(
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
			return NODE_FACTORY.updatePropertyDecl(
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
