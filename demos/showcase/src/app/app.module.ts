import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";

import { AccordionModule } from "@electric/components/accordion";
import { AppShellModule } from "@electric/components/app-shell";
import { ButtonModule } from "@electric/components/button";
import { DialogModule } from "@electric/components/dialog";
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
		AccordionModule,
		AppShellModule,
		BrowserModule,
		BrowserAnimationsModule,
		ButtonModule,
		DialogModule,
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
