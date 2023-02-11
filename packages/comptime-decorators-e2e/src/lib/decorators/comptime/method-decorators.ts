import { MethodDecorator } from "@electric/comptime-decorators";

export const methodDecoratorFn: MethodDecorator = function (node, $) {
	return this.factory.updateMethodDeclaration(
		node,
		node.modifiers,
		node.asteriskToken,
		node.name,
		node.questionToken,
		node.typeParameters,
		node.parameters,
		node.type,
		$.Block([
			$.ExpressionStmt(
				$.CallExpr(
					$.PropertyAccessExpr(
						$.Identifier("console"),
						$.Identifier("log")
					),
					undefined,
					[
						$.StringLiteral("Hello, world!")
					]
				)
			),
			...(node.body?.statements ?? [])
		])
	)
}

export function methodDecoratorFactory(): MethodDecorator {
	return methodDecoratorFn
}
