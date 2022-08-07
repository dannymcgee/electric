import { NgModule } from "@angular/core";

import { ComponentOutletDirective } from "./component-outlet.directive";
import { UnwrapDirective } from "./unwrap.directive";

@NgModule({
	declarations: [
		ComponentOutletDirective,
		UnwrapDirective,
	],
	exports: [
		ComponentOutletDirective,
		UnwrapDirective,
	],
})
export class UtilityModule {}
