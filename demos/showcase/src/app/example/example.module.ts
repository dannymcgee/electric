import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";

import { AccordionModule } from "@electric/components/accordion";
import { ResizeHandleModule } from "@electric/components/resize-handle";
import { UtilityModule } from "@electric/ng-utils";

import { ExampleCodeComponent } from "./example-code/example-code.component";
import {
	FormatCodePipe,
	JoinLinesPipe,
	LinesPipe,
	StripDefaultsPipe,
	StripIndentsPipe,
	HighlightPipe,
} from "./example-code/example-code.pipe";
import { LineNumbersComponent } from "./example-code/line-numbers.component";
import {
	ExampleControlsComponent,
	ExampleControlsSectionDirective,
} from "./example-controls/example-controls.component";
import { ExampleDemoComponent } from "./example-demo/example-demo.component";
import { ExampleComponent } from "./example.component";

@NgModule({
	imports: [
		AccordionModule,
		CommonModule,
		ResizeHandleModule,
		UtilityModule,
	],
	declarations: [
		ExampleComponent,
		ExampleCodeComponent,
		ExampleControlsComponent,
		ExampleControlsSectionDirective,
		ExampleDemoComponent,
		LineNumbersComponent,
		HighlightPipe,
		LinesPipe,
		StripIndentsPipe,
		StripDefaultsPipe,
		JoinLinesPipe,
		FormatCodePipe,
	],
	exports: [
		ExampleComponent,
		ExampleCodeComponent,
		ExampleControlsComponent,
		ExampleControlsSectionDirective,
		ExampleDemoComponent,
	],
})
export class ExampleModule {}
