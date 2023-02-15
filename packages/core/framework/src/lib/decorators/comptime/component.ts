import { ClassDecorator } from "@electric/comptime-decorators"
import * as ts from "typescript"

import { getContext } from "./context"

export function Component(tagName: string): ClassDecorator {
	return function (node, $) {
		const cx = getContext.call(this)
		const observedAttributes = $.PropertyDecl(
			[$.Token(ts.SyntaxKind.StaticKeyword)],
			$.Identifier("observedAttributes"),
			undefined,
			undefined,
			$.ArrayLiteralExpr(
				cx.getInputs(this.original(node))
					.map(p => $.StringLiteral((p.name as ts.Identifier).text))
			)
		)

		return [
			$.updateClassDecl(
				node,
				node.modifiers,
				node.name,
				node.typeParameters,
				node.heritageClauses,
				[
					observedAttributes,
					...node.members
				]
			),
			$.ExpressionStmt(
				$.CallExpr(
					$.PropertyAccessExpr(
						$.Identifier("customElements"),
						$.Identifier("define")
					),
					undefined,
					[
						$.StringLiteral(tagName),
						node.name!
					]
				)
			)
		]
	}
}
