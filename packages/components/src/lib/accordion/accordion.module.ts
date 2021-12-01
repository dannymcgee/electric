import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";

import { IconModule } from "@electric/components/icon";

import {
	AccordionComponent,
	AccordionGroupComponent,
	AccordionHeaderComponent,
	AccordionContentDirective,
	AccordionToolbarDirective,
} from "./accordion.component";

@NgModule({
	imports: [
		CommonModule,
		IconModule
	],
	declarations: [
		AccordionComponent,
		AccordionGroupComponent,
		AccordionHeaderComponent,
		AccordionContentDirective,
		AccordionToolbarDirective,
	],
	exports: [
		AccordionComponent,
		AccordionGroupComponent,
		AccordionHeaderComponent,
		AccordionContentDirective,
		AccordionToolbarDirective,
	],
})
export class AccordionModule {}
