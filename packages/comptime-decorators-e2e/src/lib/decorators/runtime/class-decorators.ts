export const ClassDecoratorFn: ClassDecorator = function () {}

export function ClassDecoratorFactory(
	testString: string,
	testTemplate: string,
	testNumber: number,
	testBigint: bigint,
	testRegex: RegExp,
	testBool: boolean,
	testNil: null | undefined,
): ClassDecorator {
	return function () {}
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

export function ClassDecoratorFactoryObjectified(
	params: ClassDecoratorFactoryParams
): ClassDecorator {
	return function () {}
}
