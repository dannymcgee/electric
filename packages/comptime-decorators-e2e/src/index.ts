import {
	ClassDecoratorFactory,
	ClassDecoratorFn,
	methodDecoratorFactory,
	methodDecoratorFn,
	propDecoratorFactory,
	propDecoratorFn,
} from "./lib/decorators/runtime";

@ClassDecoratorFn
export class DecoratorFnTest {
	@propDecoratorFn
	decoratedProp = "Hello, world!"

	@methodDecoratorFn
	hello(): void {}
}

@ClassDecoratorFactory(
	"Hello, world!",
	`Hello, world!`,
	42,
	123456789123456789123456789123456789n,
	/[_a-zA-Z][_a-zA-Z0-9]*/g,
	true,
	null
)
export class DecoratorFactoryTest {
	@propDecoratorFactory()
	decoratedProp = "Hello, world!"

	@methodDecoratorFactory()
	hello(): void {}
}
