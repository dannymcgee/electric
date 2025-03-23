import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { OverlayModule } from "@angular/cdk/overlay";

import { IconModule } from "@electric/components/icon";

import {
	DialogComponent,
	DialogFooterDirective,
	DialogHeadingComponent,
} from "./dialog.component";
import { DialogTriggerDirective } from "./dialog.directive";

@NgModule({
	imports: [
		CommonModule,
		IconModule,
		OverlayModule,
	],
	declarations: [
		DialogComponent,
		DialogHeadingComponent,
		DialogFooterDirective,
		DialogTriggerDirective,
	],
	exports: [
		DialogComponent,
		DialogHeadingComponent,
		DialogFooterDirective,
		DialogTriggerDirective,
	],
})
export class DialogModule {}
