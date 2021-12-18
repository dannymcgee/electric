import { NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";

import { AccordionExample } from "./accordion/accordion.example";
import { ButtonExample } from "./button/button.example";
import { DialogExample } from "./dialog/dialog.example";

export const ROUTES = [{
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
	}, {
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
