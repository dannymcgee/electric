import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";

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

@NgModule({
	imports: [CommonModule],
	declarations: [
		FormFieldComponent,
		InputComponent,
		LabelComponent,
		LabelPrefixDirective,
		LabelPostfixDirective,
		LegendComponent,
		RadioGroupComponent,
		RadioComponent,
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
	],
})
export class FormControlsModule {}
