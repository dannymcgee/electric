import { ChangeDetectorRef } from "@angular/core";

import { decorateMethod, NgClass, PropertyDecorator } from "./internal/decorate";

export interface ChangeDetectable {
	readonly changeDetector: ChangeDetectorRef;
}

/**
 * Marks a component as dirty (needing change detection) when the property value
 * changes. This can be useful for `OnPush` components when a value is changed
 * by some mechanism other than a template binding.
 *
 * ### WARNING
 * This decorator uses internal Angular APIs, and cannot be guaranteed to remain
 * stable between Angular minor/patch versions. You have been warned!
 */
export function DetectChanges<T extends ChangeDetectable>(): PropertyDecorator<T> {
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
			set(this: T, value: any) {
				(this as any)[$prop] = value;

				if ((this as any)[$initialized])
					this.changeDetector.markForCheck();
			},
			enumerable: true,
			configurable: true,
		});
	}
}
