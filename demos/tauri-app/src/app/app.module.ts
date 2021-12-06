import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";

import { AppShellModule } from "@electric/components/app-shell";
import { IconModule } from "@electric/components/icon";
import { MenuModule } from "@electric/components/menu";
import {
	ThemeModule,
	DEFAULT_THEME,
	ThemeService,
} from "@electric/components/theme";
import { ICONS } from "@electric/style";

import { AppComponent } from "./app.component";

@NgModule({
	imports: [
		AppShellModule,
		BrowserModule,
		BrowserAnimationsModule,
		IconModule.withIcons(ICONS),
		MenuModule,
		ThemeModule.withTheme(DEFAULT_THEME, "dark"),
	],
	declarations: [AppComponent],
	bootstrap: [AppComponent],
})
export class AppModule {
	constructor (private _: ThemeService) {}
}
