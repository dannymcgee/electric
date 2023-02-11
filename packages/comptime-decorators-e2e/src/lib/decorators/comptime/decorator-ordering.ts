import { PropertyDecorator } from "@electric/comptime-decorators";
import * as ts from "typescript";

export const first: PropertyDecorator = function (node, $) {
	return [
		$.updatePropertyDecl(
			node,
			node.modifiers,
			$.Identifier(`${(node.name as ts.Identifier).text}_first`),
			node.questionToken ?? node.exclamationToken,
			node.type,
			node.initializer
		),
		$.PropertyDecl(
			undefined,
			$.PrivateIdentifier("#firstAddtl"),
			undefined,
			undefined,
			$.StringLiteral("first")
		)
	]
}

export const second: PropertyDecorator = function (node, $) {
	return [
		$.updatePropertyDecl(
			node,
			node.modifiers,
			$.Identifier(`${(node.name as ts.Identifier).text}_second`),
			node.questionToken ?? node.exclamationToken,
			node.type,
			node.initializer
		),
		$.PropertyDecl(
			undefined,
			$.PrivateIdentifier("#secondAddtl"),
			undefined,
			undefined,
			$.StringLiteral("second")
		)
	]
}

export const third: PropertyDecorator = function (node, $) {
	return [
		$.updatePropertyDecl(
			node,
			node.modifiers,
			$.Identifier(`${(node.name as ts.Identifier).text}_third`),
			node.questionToken ?? node.exclamationToken,
			node.type,
			node.initializer
		),
		$.PropertyDecl(
			undefined,
			$.PrivateIdentifier("#thirdAddtl"),
			undefined,
			undefined,
			$.StringLiteral("third")
		)
	]
}
