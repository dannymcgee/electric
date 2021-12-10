import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";

import { FormFieldComponent } from "./form-field/form-field.component";
import { InputComponent } from "./input/input.component";
import {
	LabelComponent,
	LabelPostfixDirective,
	LabelPrefixDirective,
} from "./label/label.component";

@NgModule({
	imports: [CommonModule],
	declarations: [
		FormFieldComponent,
		InputComponent,
		LabelComponent,
		LabelPrefixDirective,
		LabelPostfixDirective,
	],
	exports: [
		FormFieldComponent,
		InputComponent,
		LabelComponent,
		LabelPrefixDirective,
		LabelPostfixDirective,
	],
})
export class FormControlsModule {}
