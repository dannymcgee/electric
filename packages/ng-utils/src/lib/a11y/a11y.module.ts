import { NgModule } from "@angular/core";
import { AutofocusDirective } from "./autofocus.directive";
import { ButtonBehaviorDirective } from "./button-behavior.directive";
import { KeybindDirective } from "./keybind.directive";

@NgModule({
	declarations: [
		AutofocusDirective,
		ButtonBehaviorDirective,
		KeybindDirective,
	],
	exports: [
		AutofocusDirective,
		ButtonBehaviorDirective,
		KeybindDirective,
	],
})
export class A11yModule {}
