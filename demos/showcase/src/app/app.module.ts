import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";

import { AccordionModule } from "@electric/components/accordion";
import { ButtonModule } from "@electric/components/button";
import { DialogModule } from "@electric/components/dialog";
import { IconModule } from "@electric/components/icon";
import { MenuModule } from "@electric/components/menu";
import {
	ThemeModule,
	DEFAULT_THEME,
	ThemeService,
} from "@electric/components/theme";
import { a11y, ICONS } from "@electric/style";

import { AppComponent } from "./app.component";

@NgModule({
	imports: [
		AccordionModule,
		BrowserModule,
		BrowserAnimationsModule,
		ButtonModule,
		DialogModule,
		IconModule.withConfig({
			icons: ICONS,
			sizes: {
				xs: a11y.rem(16),
				sm: a11y.rem(18),
				md: a11y.rem(20),
				lg: a11y.rem(24),
			},
		}),
		MenuModule,
		ThemeModule.withTheme(DEFAULT_THEME, "dark"),
	],
	declarations: [AppComponent],
	bootstrap: [AppComponent],
})
export class AppModule {
	constructor (private _: ThemeService) {}
}
