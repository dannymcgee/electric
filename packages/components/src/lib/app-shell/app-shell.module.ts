import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";

import { IconModule } from "../icon";

import { AppShellComponent } from "./app-shell.component";
import { MainViewportComponent } from './main-viewport/main-viewport.component';
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
		MainViewportComponent,
		TitlebarComponent,
		TitlebarIconDirective,
	],
	exports: [
		AppShellComponent,
		MainViewportComponent,
		TitlebarComponent,
		TitlebarIconDirective,
	],
})
export class AppShellModule {}
