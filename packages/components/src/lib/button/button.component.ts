import { FocusMonitor, FocusOrigin, FocusOptions } from "@angular/cdk/a11y";
import { coerceBooleanProperty } from "@angular/cdk/coercion";
import {
	Component,
	OnInit,
	ViewEncapsulation,
	ChangeDetectionStrategy,
	OnDestroy,
	ElementRef,
	Input,
	HostBinding,
} from "@angular/core";

import { IconName } from "@electric/components/icon";
import { Focusable, INITIAL_FOCUS_TARGET } from "@electric/ng-utils";

import { ButtonSize, ButtonVariant } from "./button.types";

@Component({
	selector: `[elx-btn]:not([elx-btn="primary"])`,
	templateUrl: "./button.component.html",
	styleUrls: ["./button.component.scss"],
	encapsulation: ViewEncapsulation.None,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonComponent implements Focusable, OnInit, OnDestroy {
	@HostBinding("class")
	get hostClasses(): string[] {
		let base = "elx-btn";
		let size = `${base}--${this.size}`;
		let variant = `${base}--${this.variant}`;

		return [base, size, variant];
	}

	@HostBinding("attr.role")
	@Input() role = "button";

	@Input("elx-btn")
	get variant() { return this._variant; }
	set variant(value) { if (value) this._variant = value; }
	private _variant: ButtonVariant = "tertiary";

	@Input() size: ButtonSize = "md";
	@Input() icon?: IconName;

	@HostBinding("class.disabled")
	@Input()
	get disabled() { return this._disabled; }
	set disabled(value) {
		this._disabled = coerceBooleanProperty(value);
		if (
			this._element instanceof HTMLButtonElement
			|| this._element instanceof HTMLInputElement
		) {
			this._element.disabled = this._disabled;
		} else {
			if (value) {
				this._element.setAttribute("aria-disabled", "true");
			} else {
				this._element.removeAttribute("aria-disabled");
			}
		}
	}
	private _disabled?: boolean;

	@HostBinding()
	get tabIndex() {
		if (this._disabled) return -1;
		return 0;
	}

	private get _element() { return this._elementRef.nativeElement; }

	constructor (
		private _elementRef: ElementRef<HTMLElement>,
		private _focusMonitor: FocusMonitor,
	) {}

	ngOnInit(): void {
		this._focusMonitor.monitor(this._elementRef);
	}

	ngOnDestroy(): void {
		this._focusMonitor.stopMonitoring(this._elementRef);
	}

	focus(origin?: FocusOrigin, options?: FocusOptions): void {
		this._focusMonitor.focusVia(this._elementRef, origin ?? null, options);
	}
}


@Component({
	selector: `[elx-btn="primary"]`,
	templateUrl: "./button.component.html",
	styleUrls: ["./button.component.scss"],
	providers: [{
		provide: INITIAL_FOCUS_TARGET,
		useExisting: PrimaryButtonComponent,
	}],
	encapsulation: ViewEncapsulation.None,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrimaryButtonComponent extends ButtonComponent {
	// This extremely hacky component only exists to provide the
	// `INITIAL_FOCUS_TARGET` token exclusively for "primary" buttons,
	// accomplished by abusing the `selector` metadata.
}
