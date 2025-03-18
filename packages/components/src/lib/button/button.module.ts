import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";

import { IconModule } from "../icon";

import { ButtonComponent, PrimaryButtonComponent } from "./button.component";

@NgModule({
	imports: [
		CommonModule,
		IconModule,
	],
	declarations: [
		ButtonComponent,
		PrimaryButtonComponent,
	],
	exports: [
		ButtonComponent,
		PrimaryButtonComponent,
	],
})
export class ButtonModule {}
