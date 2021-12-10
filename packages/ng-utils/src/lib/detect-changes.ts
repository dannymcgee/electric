import { ɵmarkDirty as markDirty } from "@angular/core";

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
		let symbol = Symbol(propName.toString());

		Object.defineProperty(proto, propName, {
			get() {
				return this[symbol];
			},
			set(value: any) {
				this[symbol] = value;
				markDirty(this);
			},
			enumerable: true,
			configurable: false,
		});
	}
}
