import { A11yModule as CdkA11yModule } from "@angular/cdk/a11y";
import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";

import { A11yModule } from "@electric/ng-utils";

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
		A11yModule,
		CdkA11yModule,
		CommonModule,
		IconModule,
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
