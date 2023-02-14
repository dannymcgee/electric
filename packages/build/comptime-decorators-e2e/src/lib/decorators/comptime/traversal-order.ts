import {
	ClassDecorator,
	PluginContext,
	PropertyDecorator,
} from "@electric/comptime-decorators"
import * as ts from "typescript"

interface Context {
	propNames: string[]
}

export const PostorderClass: ClassDecorator<Context | undefined>
= function (node, $) {
	const cx = getContext.call(this)

	return $.updateClassDecl(
		node,
		node.modifiers,
		node.name,
		node.typeParameters,
		node.heritageClauses,
		[
			$.PropertyDecl(
				[$.Token(ts.SyntaxKind.StaticKeyword)],
				$.Identifier("decoratedPropNames"),
				undefined,
				undefined,
				$.ArrayLiteralExpr(
					cx.propNames.map(name => $.StringLiteral(name))
				)
			),
			...node.members
		]
	)
}

export const postorder: PropertyDecorator<Context | undefined>
= function (node) {
	const cx = getContext.call(this)
	cx.propNames.push((node.name as ts.Identifier).text)

	return node
}

function getContext(this: PluginContext<Context | undefined>): Context {
	return this.userContext ??= { propNames: [] }
}
