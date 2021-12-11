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
	FieldSet,
	FIELD_SET,
	FormLabel,
	FORM_LABEL,
	FormControl,
	FORM_CONTROL,
	Legend,
	LEGEND,
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

	@ContentChild(FORM_CONTROL)
	private _control?: FormControl;

	@ContentChild(FORM_LABEL)
	private _label?: FormLabel;

	@ContentChild(FIELD_SET)
	private _fieldset?: FieldSet;

	@ContentChild(LEGEND)
	private _legend?: Legend;

	constructor (
		private _changeDetector: ChangeDetectorRef,
	) {}

	ngDoCheck(): void {
		if (this._label && this._control) {
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
		else if (this._legend && this._fieldset) {
			if (
				this._legend.id && this._fieldset.labelId
				&& this._legend.id === this._fieldset.labelId
			) {
				return;
			}

			let id = this._legend.id || elementId("legend");
			if (this._legend.id !== id) {
				this._legend.id = id;
			}
			this._fieldset.labelId = id;

			this._changeDetector.detectChanges();
		}
	}
}
