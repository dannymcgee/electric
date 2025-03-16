import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";

import { AccordionExample } from "./accordion/accordion.example";
import { ButtonExample } from "./button/button.example";
import { DialogExample } from "./dialog/dialog.example";
import { GraphExample } from "./graph/graph.example";

export const ROUTES: Routes = [{
	path: "",
	children: [{
		path: "accordion",
		name: "Accordion",
		component: AccordionExample,
	}, {
		path: "button",
		name: "Button",
		component: ButtonExample,
	}, {
		path: "dialog",
		name: "Dialog",
		component: DialogExample,
	}, /* { // TODO: this feature is really not demo-ready in its current state
		path: "graph",
		name: "Graph",
		component: GraphExample,
	}, */ {
		path: "",
		redirectTo: "accordion",
		pathMatch: "full",
	}],
}];

@NgModule({
	imports: [RouterModule.forChild(ROUTES)],
	exports: [RouterModule],
})
export class ExamplesRoutingModule {}
