import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";

import { AppShellModule } from "@electric/components/app-shell";
import { ButtonModule } from "@electric/components/button";
import { IconModule } from "@electric/components/icon";
import { MenuModule } from "@electric/components/menu";
import { ResizeHandleModule } from "@electric/components/resize-handle";
import { PlatformModule } from "@electric/platform";
import {
	ThemeModule,
	DEFAULT_THEME,
	ThemeService,
} from "@electric/components/theme";
import { ICONS } from "@electric/style";

import { ENV_PLATFORM } from "../environments/env-platform";
import { AppComponent } from "./app.component";
import { AppRoutingModule } from "./app.routes";
import { NavComponent } from './nav/nav.component';

@NgModule({
	imports: [
		// Angular modules
		BrowserModule,
		BrowserAnimationsModule,
		FormsModule,
		// Electric modules
		AppShellModule,
		ButtonModule,
		IconModule.withIcons(ICONS),
		MenuModule,
		PlatformModule.forPlatform(ENV_PLATFORM),
		ResizeHandleModule,
		ThemeModule.withTheme(DEFAULT_THEME, "dark"),
		// Routing
		AppRoutingModule,
	],
	declarations: [
		AppComponent,
		NavComponent,
	],
	bootstrap: [
		AppComponent,
	],
})
export class AppModule {
	constructor (private _: ThemeService) {}
}
