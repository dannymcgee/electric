import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";

import { IconModule } from "@electric/components/icon";

import { ButtonComponent } from "./button.component";

@NgModule({
	imports: [
		CommonModule,
		IconModule,
	],
	declarations: [ButtonComponent],
	exports: [ButtonComponent],
})
export class ButtonModule {}
