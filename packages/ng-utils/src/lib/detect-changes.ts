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
	// TODO: This doesn't appear to actually be doing anything particularly
	//       important (at least in Glyphy). Only the form controls are actually
	//       using this decorator at all, and there aren't any of those
	//       participating in Glyphy's canvas stuff.
	//
	//       Investigate where/whether this is still necessary, and find an
	//       alternative way to do it.
	return (_proto, _propName) => {
		// let propSymbol = Symbol(propName.toString());
		// let initSymbol = Symbol("init");

		// decorateMethod(proto as NgClass, "ngOnInit", function (this: any) {
		// 	this[initSymbol] = true;
		// });

		// Object.defineProperty(proto, propName, {
		// 	get() {
		// 		return this[propSymbol];
		// 	},
		// 	set(value: any) {
		// 		this[propSymbol] = value;

		// 		if (this[initSymbol]) {
		// 			// FIXME: this is going to be significantly slower than the old
		// 			//        `markDirty` call. Instead, see if we can `inject(ChangeDetectorRef)`
		// 			//        from the decorator now that we have a function for that
		// 			detectChanges(this);
		// 		}
		// 	},
		// 	enumerable: true,
		// 	configurable: true,
		// });
	}
}
