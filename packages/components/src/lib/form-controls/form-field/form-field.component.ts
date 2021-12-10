import {
	Component,
	ViewEncapsulation,
	ChangeDetectionStrategy,
	HostBinding,
	ChangeDetectorRef,
	ContentChild,
	DoCheck,
	Input,
} from "@angular/core";

import { Coerce } from "@electric/ng-utils";
import { elementId } from "@electric/utils";

import {
	FormLabel,
	FORM_LABEL,
	FormControl,
	FORM_CONTROL,
} from "../form-controls.types";

@Component({
	selector: "elx-form-field",
	templateUrl: "./form-field.component.html",
	styleUrls: ["./form-field.component.scss"],
	encapsulation: ViewEncapsulation.None,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormFieldComponent<T> implements DoCheck {
	@HostBinding("class")
	readonly hostClass = "elx-form-field";

	@HostBinding("class.inline")
	@Coerce(Boolean)
	@Input() inline = false;

	@ContentChild(FORM_CONTROL)
	private _control?: FormControl<T>;

	@ContentChild(FORM_LABEL)
	private _label?: FormLabel;

	constructor (
		private _changeDetector: ChangeDetectorRef,
	) {}

	ngDoCheck(): void {
		if (!this._control || !this._label) return;
		if (
			this._label.for && this._control.fieldId
			&& this._label.for === this._control.fieldId
		) {
			return;
		}

		let id = this._control.fieldId || elementId("form-control");
		if (this._control.fieldId !== id) {
			this._control.fieldId = id;
		}
		this._label.for = id;

		this._changeDetector.detectChanges();
	}
}
