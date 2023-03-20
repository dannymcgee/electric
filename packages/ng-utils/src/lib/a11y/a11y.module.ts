import { NgModule } from "@angular/core";
import { AutofocusDirective } from "./autofocus.directive";
import { KeybindDirective } from "./keybind.directive";

@NgModule({
	declarations: [
		AutofocusDirective,
		KeybindDirective,
	],
	exports: [
		AutofocusDirective,
		KeybindDirective,
	],
})
export class A11yModule {}
