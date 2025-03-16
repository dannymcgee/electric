import { NgModule } from "@angular/core";
import { RouterModule, Route as NgRoute } from "@angular/router";

import { AccordionExample } from "./accordion/accordion.example";
import { ButtonExample } from "./button/button.example";
import { DialogExample } from "./dialog/dialog.example";
import { GraphExample } from "./graph/graph.example";

interface Route<T extends object> extends NgRoute {
	data?: T;
	children?: Route<T>[];
}

export type ShowcaseRoute = Route<{ name: string }>;

export const ROUTES: ShowcaseRoute[] = [{
	path: "",
	children: [{
		path: "accordion",
		component: AccordionExample,
		data: { name: "Accordion" },
	}, {
		path: "button",
		component: ButtonExample,
		data: { name: "Button" },
	}, {
		path: "dialog",
		component: DialogExample,
		data: { name: "Button" },
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
