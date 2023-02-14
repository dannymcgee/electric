import { ClassDecorator } from "@electric/comptime-decorators"

export function Component(tagName: string): ClassDecorator {
	return function (node, $) {
		return [
			node,
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
