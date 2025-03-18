import { OverlayModule } from "@angular/cdk/overlay";
import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";

import { UtilityModule } from "@electric/ng-utils";

import { IconModule } from "../icon";
import { CheckboxComponent } from "./checkbox/checkbox.component";
import { FormFieldComponent } from "./form-field/form-field.component";
import { InputComponent } from "./input/input.component";
import {
	LabelComponent,
	LabelPostfixDirective,
	LabelPrefixDirective,
} from "./label/label.component";
import { RadioGroupComponent } from './radio/radio-group/radio-group.component';
import { RadioComponent } from './radio/radio.component';
import {
	SelectComponent,
	SelectedValueComponent,
} from './select/select.component';
import { OptionComponent } from './select/option/option.component';
import { OptionListComponent } from './select/option-list/option-list.component';
import { FieldsetComponent } from "./fieldset/fieldset.component";

@NgModule({
	imports: [
		CommonModule,
		IconModule,
		OverlayModule,
		UtilityModule,
	],
	declarations: [
		CheckboxComponent,
		FieldsetComponent,
		FormFieldComponent,
		InputComponent,
		LabelComponent,
		LabelPrefixDirective,
		LabelPostfixDirective,
		RadioGroupComponent,
		RadioComponent,
		SelectComponent,
		SelectedValueComponent,
		OptionComponent,
		OptionListComponent,
	],
	exports: [
		CheckboxComponent,
		FieldsetComponent,
		FormFieldComponent,
		InputComponent,
		LabelComponent,
		LabelPrefixDirective,
		LabelPostfixDirective,
		RadioGroupComponent,
		RadioComponent,
		SelectComponent,
		OptionComponent,
	],
})
export class FormControlsModule {}
