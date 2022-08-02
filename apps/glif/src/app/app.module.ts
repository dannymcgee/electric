import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";

import {
	AppShellModule,
	ButtonModule,
	DEFAULT_THEME,
	IconModule,
	MenuModule,
	ThemeModule,
	ThemeService,
} from "@electric/components";
import { AppPlatform, PlatformModule } from "@electric/platform";
import { ICONS } from "@electric/style";

import { AppComponent, CffProgramPipe } from "./app.component";
import { Interpreter } from "./glyph/vm";

@NgModule({
	imports: [
		// Angular modules
		BrowserModule,
		BrowserAnimationsModule,
		// Electric modules
		AppShellModule,
		ButtonModule,
		IconModule.withIcons(ICONS),
		MenuModule,
		PlatformModule.forPlatform(AppPlatform.Tauri),
		ThemeModule.withTheme(DEFAULT_THEME, "dark"),
	],
	declarations: [
		AppComponent,
		CffProgramPipe,
		Interpreter,
	],
	bootstrap: [
		AppComponent,
	],
})
export class AppModule {
	constructor (private _: ThemeService) {}
}
