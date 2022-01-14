import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";

import { AccordionModule } from "@electric/components/accordion";
import { ButtonModule } from "@electric/components/button";
import { DialogModule } from "@electric/components/dialog";
import { FormControlsModule } from "@electric/components/form-controls";
import { GraphModule } from "@electric/components/graph";
import { IconModule } from "@electric/components/icon";
import { ResizeHandleModule } from "@electric/components/resize-handle";
import { TabsModule } from "@electric/components/tabs";
import { UtilityModule } from "@electric/ng-utils";

import { ExampleCodeViewComponent } from "./example-code/code-view/example-code-view.component";
import { ExampleCodeComponent } from "./example-code/example-code.component";
import {
	FormatCodePipe,
	JoinLinesPipe,
	LinesPipe,
	StripDefaultsPipe,
	StripIndentsPipe,
	HighlightPipe,
} from "./example-code/example-code.pipe";
import { LineNumbersComponent } from "./example-code/line-numbers/line-numbers.component";
import {
	ExampleControlsComponent,
	ExampleControlsSectionDirective,
} from "./example-controls/example-controls.component";
import { ExampleDemoComponent } from "./example-demo/example-demo.component";
import { ExampleComponent } from "./example.component";

import { ExamplesRoutingModule } from "./routes/examples.routes";
import { AccordionExample } from "./routes/accordion/accordion.example";
import { ButtonExample } from "./routes/button/button.example";
import { DialogExample } from "./routes/dialog/dialog.example";
import { GraphExample } from './routes/graph/graph.example';

@NgModule({
	imports: [
		// Angular modules
		CommonModule,
		FormsModule,
		// Electric modules
		AccordionModule,
		ButtonModule,
		DialogModule,
		GraphModule,
		IconModule,
		FormControlsModule,
		ResizeHandleModule,
		TabsModule,
		UtilityModule,
		// Routing
		ExamplesRoutingModule,
	],
	declarations: [
		// Shared
		ExampleComponent,
		ExampleCodeComponent,
		ExampleCodeViewComponent,
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
		// Routes
		AccordionExample,
		ButtonExample,
		DialogExample,
		GraphExample,
	],
})
export class ExampleModule {}
