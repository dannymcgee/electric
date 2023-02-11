export const ClassDecoratorFn: ClassDecorator = function () {}

export function ClassDecoratorFactory(
	testString: string,
	testTemplate: string,
	testNumber: number,
	testBigint: bigint,
	testRegex: RegExp,
	testBool: boolean,
	testNil: null,
): ClassDecorator {
	return function () {}
}
