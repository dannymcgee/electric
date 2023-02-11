import { PropertyDecorator } from "@electric/comptime-decorators";
import * as ts from "typescript"

export const propDecoratorFn: PropertyDecorator = function (node, $) {
	const name = (node.name as ts.Identifier).text
	const ident = $.Identifier(name)
	const privateIdent = $.PrivateIdentifier(`#${name}`)

	return [
		$.updatePropertyDecl(
			node,
			node.modifiers,
			privateIdent,
			node.questionToken ?? node.exclamationToken,
			node.type,
			node.initializer
		),
		$.GetAccessorDecl(
			undefined,
			ident,
			[],
			undefined,
			$.Block([
				$.ReturnStmt(
					$.PropertyAccessExpr(
						$.This(),
						privateIdent
					)
				)
			])
		),
		$.SetAccessorDecl(
			undefined,
			ident,
			[
				$.ParameterDecl(
					undefined,
					undefined,
					$.Identifier("value")
				)
			],
			$.Block([
				$.ExpressionStmt(
					$.Assignment(
						$.PropertyAccessExpr(
							$.This(),
							privateIdent
						),
						$.Identifier("value")
					)
				)
			])
		)
	]
}

export function propDecoratorFactory(): PropertyDecorator {
	return propDecoratorFn
}
