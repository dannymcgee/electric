import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";

import { AccordionModule } from "@electric/components/accordion";
import { ResizeHandleModule } from "@electric/components/resize-handle";

import { ExampleCodeComponent } from "./example-code/example-code.component";
import {
	ExampleControlsComponent,
	ExampleControlsSectionDirective,
} from "./example-controls/example-controls.component";
import { ExampleDemoComponent } from "./example-demo/example-demo.component";
import { ExampleComponent } from "./example.component";
import { TokenizePipe } from "./example-code/tokenize.pipe";

@NgModule({
	imports: [
		AccordionModule,
		CommonModule,
		ResizeHandleModule,
	],
	declarations: [
		ExampleComponent,
		ExampleCodeComponent,
		ExampleControlsComponent,
		ExampleControlsSectionDirective,
		ExampleDemoComponent,
		TokenizePipe,
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
