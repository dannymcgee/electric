import { ɵdetectChanges } from "@angular/core";

import { decorateMethod, NgClass } from "./internal/decorate";

/**
 * Marks a component as dirty (needing change detection) when the property value
 * changes. This can be useful for `OnPush` components when a value is changed
 * by some mechanism other than a template binding.
 *
 * ### WARNING
 * This decorator uses internal Angular APIs, and cannot be guaranteed to remain
 * stable between Angular minor/patch versions. You have been warned!
 */
export function DetectChanges(): PropertyDecorator {
	return (proto, propName) => {
		let $prop = Symbol(propName.toString());
		let $initialized = Symbol("init");

		decorateMethod(proto as NgClass, "ngOnInit", function (this: any) {
			this[$initialized] = true;
		});

		Object.defineProperty(proto, propName, {
			get() {
				return this[$prop];
			},
			set(value: any) {
				this[$prop] = value;

				if (this[$initialized]) {
					// FIXME: this is going to be significantly slower than the old
					//        `ɵmarkDirty` call, which has been removed from
					//        `@angular/core`'s exports. Instead, try and come up
					//        with a way to get access to the `ChangeDetectorRef` for
					//        this component.
					ɵdetectChanges(this);
				}
			},
			enumerable: true,
			configurable: true,
		});
	}
}
