import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";

import { IconModule } from "@electric/components/icon";

import { AppShellComponent } from "./app-shell.component";
import {
	TitlebarComponent,
	TitlebarIconDirective,
} from "./titlebar/titlebar.component";

@NgModule({
	imports: [
		CommonModule,
		IconModule,
	],
	declarations: [
		AppShellComponent,
		TitlebarComponent,
		TitlebarIconDirective,
	],
	exports: [
		AppShellComponent,
		TitlebarComponent,
		TitlebarIconDirective,
	],
})
export class AppShellModule {}
