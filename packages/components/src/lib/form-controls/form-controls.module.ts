import { OverlayModule } from "@angular/cdk/overlay";
import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";

import { IconModule } from "@electric/components/icon";
import { UtilityModule } from "@electric/ng-utils";

import { FormFieldComponent } from "./form-field/form-field.component";
import { InputComponent } from "./input/input.component";
import {
	LabelComponent,
	LabelPostfixDirective,
	LabelPrefixDirective,
	LegendComponent,
} from "./label/label.component";
import { RadioGroupComponent } from './radio/radio-group/radio-group.component';
import { RadioComponent } from './radio/radio.component';
import {
	SelectComponent,
	SelectedValueComponent,
} from './select/select.component';
import { OptionComponent } from './select/option/option.component';
import {
	OptionListComponent,
	OptionListLensTransformPipe,
} from './select/option-list/option-list.component';

@NgModule({
	imports: [
		CommonModule,
		IconModule,
		OverlayModule,
		UtilityModule,
	],
	declarations: [
		FormFieldComponent,
		InputComponent,
		LabelComponent,
		LabelPrefixDirective,
		LabelPostfixDirective,
		LegendComponent,
		RadioGroupComponent,
		RadioComponent,
		SelectComponent,
		SelectedValueComponent,
		OptionComponent,
		OptionListComponent,
		OptionListLensTransformPipe,
	],
	exports: [
		FormFieldComponent,
		InputComponent,
		LabelComponent,
		LabelPrefixDirective,
		LabelPostfixDirective,
		LegendComponent,
		RadioGroupComponent,
		RadioComponent,
		SelectComponent,
		OptionComponent,
	],
})
export class FormControlsModule {}
