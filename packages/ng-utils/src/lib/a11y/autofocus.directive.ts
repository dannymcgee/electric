import { FocusMonitor, FocusOrigin, FocusOptions } from "@angular/cdk/a11y";
import { Directive, ElementRef } from "@angular/core";

import { Focusable, INITIAL_FOCUS_TARGET } from "./a11y.types";

@Directive({
	selector: "[elxAutofocus]",
	providers: [{
		provide: INITIAL_FOCUS_TARGET,
		useExisting: AutofocusDirective,
	}],
})
export class AutofocusDirective implements Focusable {
	constructor (
		private _elementRef: ElementRef<HTMLElement>,
		private _focusMonitor: FocusMonitor,
	) {}

	focus(origin?: FocusOrigin, options?: FocusOptions) {
		this._focusMonitor.focusVia(this._elementRef, origin ?? null, options);
	}
}
