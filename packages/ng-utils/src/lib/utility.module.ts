import { NgModule } from "@angular/core";
import { DeferredRenderDirective } from "./deferred-render.directive";

import { UnwrapDirective } from "./unwrap.directive";

@NgModule({
	declarations: [
		DeferredRenderDirective,
		UnwrapDirective,
	],
	exports: [
		DeferredRenderDirective,
		UnwrapDirective,
	],
})
export class UtilityModule {}
