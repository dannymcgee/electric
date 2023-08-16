import { OverlayModule } from "@angular/cdk/overlay";
import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";

import { TooltipComponent } from "./tooltip.component";
import { TooltipDirective } from "./tooltip.directive";

@NgModule({
	imports: [
		CommonModule,
		OverlayModule,
	],
	declarations: [
		TooltipComponent,
		TooltipDirective,
	],
	exports: [
		TooltipDirective,
	],
})
export class TooltipModule {}
