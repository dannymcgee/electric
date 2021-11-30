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
import { FocusMonitor, FocusOrigin } from "@angular/cdk/a11y";

import { ButtonSize, ButtonVariant } from "./button.types";

@Component({
	selector: "[elx-btn]",
	templateUrl: "./button.component.html",
	styleUrls: ["./button.component.scss"],
	encapsulation: ViewEncapsulation.None,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonComponent implements OnInit, OnDestroy {
	@Input("elx-btn")
	get variant() { return this._variant; }
	set variant(value) { if (value) this._variant = value; }
	private _variant: ButtonVariant = "tertiary";

	@Input() size: ButtonSize = "md";
	// @Input() icon?: IconName; // TODO

	@HostBinding("attr.role")
	@Input() role = "button";

	@HostBinding("class")
	get hostClasses(): string[] {
		let base = "elx-btn";
		let size = `${base}--${this.size}`;
		let variant = `${base}--${this.variant}`;

		return [base, size, variant];
	}

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

	focus(origin?: FocusOrigin): void {
		this._focusMonitor.focusVia(this._elementRef, origin ?? null);
	}
}
