import * as ts from "typescript";
import { getContext, PropertyDecorator } from "./context"

export const input: PropertyDecorator
= function (node, $) {
	getContext.call(this).addInput(this.original(node).parent, node)

	const propName = (node.name as ts.Identifier).text

	return [
		// get <propName>() { return this.#__$<propName>_accessor.get() }
		// --------------------------------------------------------------
		// FIXME: TypeScript transformers can't create get/set accessors due to
		// a faulty non-null assertion in the compiler. Tracked by this
		// 6-year-old issue: https://github.com/microsoft/TypeScript/issues/18217
		$.GetAccessorDecl(
			node.modifiers,
			node.name,
			[],
			undefined,
			$.Block([
				$.ReturnStmt(
					$.CallExpr(
						$.PropertyAccessExpr(
							$.PropertyAccessExpr(
								$.This(),
								$.PrivateIdentifier(`#__$${propName}_accessor`)
							),
							$.Identifier("get")
						),
						undefined,
						[]
					)
				)
			])
		),
		// set #__$<propName>(value) { this.#__$<propName>_accessor.set(value) }
		// --------------------------------------------------------------
		// FIXME: TypeScript transformers can't create get/set accessors due to
		// a faulty non-null assertion in the compiler. Tracked by this
		// 6-year-old issue: https://github.com/microsoft/TypeScript/issues/18217
		$.SetAccessorDecl(
			undefined,
			$.PrivateIdentifier(`#__$${propName}`),
			[$.ParameterDecl(undefined, undefined, "value")],
			$.Block([
				$.ExpressionStmt(
					$.CallExpr(
						$.PropertyAccessExpr(
							$.PropertyAccessExpr(
								$.This(),
								$.PrivateIdentifier(`#__$${propName}_accessor`)
							),
							$.Identifier("set")
						),
						undefined,
						[$.Identifier("value")]
					)
				)
			])
		),
		// TODO: Get original node type to figure out which Serde impl we need
		// #__$<propName>_accessor = new __$InputAccessor({
		//   serde: __$STRING,
		//   init: <node.initializer>
		// })
		$.PropertyDecl(
			undefined,
			$.PrivateIdentifier(`#__$${propName}_accessor`),
			undefined,
			undefined,
			$.NewExpr(
				$.Identifier("__$InputAccessor"),
				undefined,
				[
					$.ObjectLiteralExpr([
						$.PropertyAssignment(
							$.Identifier("serde"),
							$.Identifier("__$STRING")
						),
						$.PropertyAssignment(
							$.Identifier("init"),
							node.initializer ?? $.Identifier("undefined")
						),
					]),
				]
			)
		),
	]
}
