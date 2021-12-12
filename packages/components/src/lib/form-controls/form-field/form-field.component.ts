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
	CustomControl,
	CUSTOM_CONTROL,
	FormLabel,
	FORM_LABEL,
	NativeControl,
	NATIVE_CONTROL,
} from "../form-controls.types";

@Component({
	selector: "elx-form-field",
	template: `

<ng-content select="elx-label"></ng-content>
<ng-content></ng-content>

	`,
	styleUrls: ["./form-field.component.scss"],
	encapsulation: ViewEncapsulation.None,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormFieldComponent implements DoCheck {
	@HostBinding("class")
	readonly hostClass = "elx-form-field";

	@HostBinding("class.inline")
	@Coerce(Boolean)
	@Input() inline = false;

	@ContentChild(NATIVE_CONTROL)
	private _nativeControl?: NativeControl;

	@ContentChild(CUSTOM_CONTROL)
	private _customControl?: CustomControl;

	@ContentChild(FORM_LABEL)
	private _label?: FormLabel;

	constructor (
		private _changeDetector: ChangeDetectorRef,
	) {}

	ngDoCheck(): void {
		if (this._label && this._nativeControl) {
			if (
				this._label.for && this._nativeControl.fieldId
				&& this._label.for === this._nativeControl.fieldId
			) {
				return;
			}

			let id = this._nativeControl.fieldId || elementId("form-control");
			if (this._nativeControl.fieldId !== id) {
				this._nativeControl.fieldId = id;
			}
			this._label.for = id;
			this._label.useNative = true;

			this._changeDetector.detectChanges();
		}
		else if (this._label && this._customControl) {
			if (
				this._label.id && this._customControl.labelId
				&& this._label.id === this._customControl.labelId
			) {
				return;
			}

			let id = this._label.id || elementId("form-label");
			if (this._label.id !== id) {
				this._label.id = id;
			}
			this._customControl.labelId = id;
			this._label.useNative = false;

			this._changeDetector.detectChanges();
		}
	}
}
