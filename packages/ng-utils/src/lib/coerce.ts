import { coerceBooleanProperty, coerceNumberProperty } from "@angular/cdk/coercion";

import { Fn } from "@electric/utils";

type Coerced<Ctor> = Ctor extends (...args: any[]) => infer R ? R : never;

export function Coerce(
	typeHint: typeof Number | typeof Boolean
): PropertyDecorator {
	return (proto, propName) => {
		let symbol = Symbol(propName.toString());
		let coerce: Fn<[any], Coerced<typeof typeHint>|null>;

		switch (typeHint) {
			case Number: {
				coerce = (value: any) => {
					if (value == null) return null;
					return coerceNumberProperty(value);
				}
				break;
			}
			case Boolean: {
				coerce = coerceBooleanProperty;
				break;
			}
			default: {
				throw new Error(
					"Invalid `Coerce` argument -- expected `Number` or `Boolean`"
				);
			}
		}

		Object.defineProperty(proto, propName, {
			get(): Coerced<typeof typeHint> {
				return this[symbol];
			},
			set(value: any) {
				this[symbol] = coerce(value);
			},
			enumerable: true,
			configurable: true,
		});
	};
}
