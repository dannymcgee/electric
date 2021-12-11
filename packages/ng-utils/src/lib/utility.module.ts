import { NgModule } from "@angular/core";

import { UnwrapDirective } from "./unwrap.directive";

@NgModule({
	declarations: [UnwrapDirective],
	exports: [UnwrapDirective],
})
export class UtilityModule {}
