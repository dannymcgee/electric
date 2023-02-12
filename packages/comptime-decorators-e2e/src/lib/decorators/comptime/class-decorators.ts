import { ClassDecorator } from "@electric/comptime-decorators";

export const ClassDecoratorFn: ClassDecorator = function (node, $) {
	return $.updateClassDecl(
		node,
		node.modifiers,
		node.name,
		node.typeParameters,
		node.heritageClauses,
		node.members.concat(
			$.PropertyDecl(
				[],
				$.Identifier("test"),
				undefined,
				undefined,
				$.StringLiteral("Hello, world!")
			)
		)
	)
}

export function ClassDecoratorFactory(
	testString: string,
	testTemplate: string,
	testNumber: number,
	testBigint: bigint,
	testRegex: RegExp,
	testBool: boolean,
	testNil: null | undefined,
	testNumbers?: number[]
): ClassDecorator {
	return function (node, $) {
		const members = node.members.concat(
			$.PropertyDecl(
				[],
				$.Identifier("testString"),
				undefined,
				undefined,
				$.StringLiteral(testString)
			),
			$.PropertyDecl(
				[],
				$.Identifier("testTemplate"),
				undefined,
				undefined,
				$.NoSubstitutionTemplateLiteral(testTemplate)
			),
			$.PropertyDecl(
				[],
				$.Identifier("testNumber"),
				undefined,
				undefined,
				$.NumericLiteral(testNumber)
			),
			$.PropertyDecl(
				[],
				$.Identifier("testBigint"),
				undefined,
				undefined,
				$.BigIntLiteral(`${testBigint.toString(10)}n`)
			),
			$.PropertyDecl(
				[],
				$.Identifier("testRegex"),
				undefined,
				undefined,
				$.RegularExpressionLiteral(testRegex.toString())
			),
			$.PropertyDecl(
				[],
				$.Identifier("testBool"),
				undefined,
				undefined,
				testBool ? $.True() : $.False()
			),
			$.PropertyDecl(
				[],
				$.Identifier("testNil"),
				undefined,
				undefined,
				testNil === null ? $.Null() : $.Identifier("undefined")
			),
		)

		if (testNumbers) {
			members.push(
				$.PropertyDecl(
					[],
					$.Identifier("testNumbers"),
					undefined,
					undefined,
					$.ArrayLiteralExpr(
						testNumbers.map(n => $.NumericLiteral(n))
					)
				)
			)
		}

		return $.updateClassDecl(
			node,
			node.modifiers,
			node.name,
			node.typeParameters,
			node.heritageClauses,
			members
		)
	}
}

interface ClassDecoratorFactoryParams {
	testString: string
	testTemplate: string
	testNumber: number
	testBigint: bigint
	testRegex: RegExp
	testBool: boolean
	testNil: null | undefined
	testNumbers: number[]
}

export function ClassDecoratorFactoryObjectified({
	testString,
	testTemplate,
	testNumber,
	testBigint,
	testRegex,
	testBool,
	testNil,
	testNumbers,
}: ClassDecoratorFactoryParams) {
	return ClassDecoratorFactory(
		testString,
		testTemplate,
		testNumber,
		testBigint,
		testRegex,
		testBool,
		testNil,
		testNumbers,
	)
}
