import {
	ClassDecoratorFactory,
	ClassDecoratorFn,
	first,
	methodDecoratorFactory,
	methodDecoratorFn,
	propDecoratorFactory,
	propDecoratorFn,
	second,
	third,
} from "./lib/decorators/runtime";

// `ClassDecoratorFn` should add a `test` field to `DecoratorFnTest` initialized
// to a value of `"Hello, world!"`.
@ClassDecoratorFn
export class DecoratorFnTest {
	// `propDecoratorFn` should replace `decoratedProp` with `get`/`set`
	// accessors backed by a private field.
	@propDecoratorFn
	decoratedProp = "Hello, world!"

	// `methodDecoratorFn` should add a console.log call to the body of the
	// decorated method.
	@methodDecoratorFn
	hello(): void {}
}

// `ClassDecoratorFactory` should add each argument to `DecoratorFactoryTest` as
// a class field initialized to its passed value.
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
	// `propDecoratorFactory` should replace `decoratedProp` with `get`/`set`
	// accessors backed by a private field.
	@propDecoratorFactory()
	decoratedProp = "Hello, world!"

	// `methodDecoratorFactory` should add a console.log call to the body of the
	// decorated method.
	@methodDecoratorFactory()
	hello(): void {}
}

export class DecoratorOrdering {
	// These decorators should be applied in the order implied by their names.
	// The end result should see `decoratedProp` renamed to
	// `decoratedProp_first_second_third`, followed by three new properties in
	// reverse order, `#thirdAddtl`, `#secondAddtl`, then `#firstAddtl`
	@third @second @first decoratedProp?: string
}
