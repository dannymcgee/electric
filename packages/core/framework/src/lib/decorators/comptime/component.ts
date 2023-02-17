import { ClassDecorator } from "@electric/comptime-decorators"
import * as ts from "typescript"

import { getContext } from "./context"

export function Component(tagName: string): ClassDecorator {
	return function (node, $) {
		const cx = getContext.call(this)
		const inputs = cx.getInputs(this.original(node))

		const observedAttributes = $.PropertyDecl(
			[$.Token(ts.SyntaxKind.StaticKeyword)],
			$.Identifier("observedAttributes"),
			undefined,
			undefined,
			$.ArrayLiteralExpr(
				inputs.map(p => $.StringLiteral((p.name as ts.Identifier).text))
			)
		)

		return [
			$.ImportDecl(
				undefined,
				$.ImportClause(
					false,
					$.Identifier("__$setupInputs"),
					undefined
				),
				$.StringLiteral("@electric/framework/src/lib/internal/inputs")
			),
			$.ImportDecl(
				undefined,
				$.ImportClause(
					false,
					undefined,
					$.NamedImports([
						$.ImportSpecifier(
							false,
							$.Identifier("STRING"),
							$.Identifier("__$STRING")
						)
					])
				),
				$.StringLiteral("@electric/framework/src/lib/internal/serde")
			),
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
			),
			$.ExpressionStmt(
				$.CallExpr(
					$.Identifier("__$setupInputs"),
					undefined,
					[
						node.name!,
						$.ObjectLiteralExpr(
							inputs.map(p => $.PropertyAssignment(
								p.name,
								$.ObjectLiteralExpr([
									$.PropertyAssignment(
										$.Identifier("serde"),
										$.Identifier("__$STRING"),
									),
									$.PropertyAssignment(
										$.Identifier("init"),
										p.initializer ?? $.Identifier("undefined")
									)
								])
							))
						)
					]
				)
			)
		]
	}
}
