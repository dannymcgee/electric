import {
	ChangeDetectionStrategy,
	Component,
	ElementRef,
	HostBinding,
	HostListener,
	Input,
	ViewEncapsulation,
} from "@angular/core";
import { NG_VALUE_ACCESSOR } from "@angular/forms";

import { Coerce } from "@electric/ng-utils";
import { Fn } from "@electric/utils";

import { FormControl, FORM_CONTROL } from "../form-controls.types";

export type InputType =
	| "text"
	| "email"
	| "number"
	| "password"
	| "search"
	| "tel"
	| "url";

@Component({
	selector: "input[elx-input], textarea[elx-input]",
	template: ``,
	styleUrls: ["./input.component.scss"],
	providers: [{
		provide: FORM_CONTROL,
		useExisting: InputComponent,
	}, {
		provide: NG_VALUE_ACCESSOR,
		useExisting: InputComponent,
		multi: true,
	}],
	encapsulation: ViewEncapsulation.None,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputComponent<T extends string|number>
implements FormControl<T> {
	@HostBinding("class")
	readonly hostClass = "elx-input";

	@HostBinding("type")
	@Input("elx-input")
	get type() { return this._type; }
	set type(value) { if (value) this._type = value; }
	private _type: InputType = "text";

	@HostBinding("attr.id")
	@Input("id")
	fieldId?: string;

	@HostBinding("disabled")
	@Coerce(Boolean)
	@Input() disabled = false;

	private _deferredValueChange?: T;
	private _deferredOnTouch?: boolean;

	private get _element() { return this._elementRef.nativeElement; }

	constructor (
		private _elementRef: ElementRef<HTMLInputElement>,
	) {}

	@HostListener("input")
	_onInput(): void {
		let value = this._element.value;
		switch (this.type) {
			case "number": {
				this.onChange(parseFloat(value) as T);
				break;
			}
			case "tel": {
				this.onChange(parseInt(value, 10) as T);
				break;
			}
			default: {
				this.onChange(value as T);
				break;
			}
		}
	}

	writeValue(value?: T): void {
		this._element.value = value?.toString() ?? "";
	}

	private onChange = (value?: T) => {
		this._deferredValueChange = value;
	}

	registerOnChange(fn: Fn<[T?], void>): void {
		this.onChange = fn;

		if (this._deferredValueChange) {
			fn(this._deferredValueChange);
		}
	}

	@HostListener("blur")
	_onTouched = () => {
		this._deferredOnTouch = true;
	}

	registerOnTouched(fn: Fn<[], void>): void {
		this._onTouched = fn;

		if (this._deferredOnTouch) {
			fn();
		}
	}

	setDisabledState(value: boolean): void {
		this.disabled = value;
	}
}
