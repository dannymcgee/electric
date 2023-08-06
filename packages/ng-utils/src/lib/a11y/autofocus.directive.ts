import { FocusMonitor, FocusOrigin, FocusOptions } from "@angular/cdk/a11y";
import {
	Directive,
	ElementRef,
	Input,
	OnDestroy,
	OnInit,
} from "@angular/core";
import { Subject } from "rxjs";

import { Coerce } from "../coerce";
import { Focusable, INITIAL_FOCUS_TARGET } from "./a11y.types";

@Directive({
	selector: "[elxAutofocus], [elxFocusTarget]",
	providers: [{
		provide: INITIAL_FOCUS_TARGET,
		useExisting: AutofocusDirective,
	}],
})
export class AutofocusDirective implements OnInit, OnDestroy, Focusable {
	/**
	 * When set, the element will be focused as soon as it enters the DOM.
	 *
	 * Use the `[elxFocusTarget]` selector instead if this behavior is
	 * undesirable.
	 */
	@Coerce(Boolean)
	@Input("elxAutofocus") autofocus = false;

	private _onDestroy$ = new Subject<void>();

	constructor (
		private _elementRef: ElementRef<HTMLOrSVGElement>,
		private _focusMonitor: FocusMonitor,
	) {}

	ngOnInit(): void {
		if (this.autofocus)
			setTimeout(() => this.focus());
	}

	ngOnDestroy(): void {
		this._onDestroy$.next();
		this._onDestroy$.complete();
	}

	focus(origin?: FocusOrigin, options?: FocusOptions) {
		this._focusMonitor.focusVia(
			// FocusMonitor expects an ElementRef<HTMLElement>, but it does
			// actually work with ElementRef<SVGElement>
			this._elementRef as ElementRef<HTMLElement>,
			origin ?? "program",
			options,
		);
	}
}
