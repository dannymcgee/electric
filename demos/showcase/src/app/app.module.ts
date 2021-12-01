import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";

import { ButtonModule } from "@electric/components/button";
import { IconModule } from "@electric/components/icon";
import { ThemeModule, DEFAULT_THEME, ThemeService } from "@electric/components/theme";
import { a11y, ICONS } from "@electric/style";

import { AppComponent } from "./app.component";

@NgModule({
	imports: [
		BrowserModule,
		ButtonModule,
		IconModule.withConfig({
			icons: ICONS,
			sizes: {
				xs: a11y.rem(16),
				sm: a11y.rem(18),
				md: a11y.rem(20),
				lg: a11y.rem(24),
			},
		}),
		ThemeModule.withTheme(DEFAULT_THEME, "dark"),
	],
	declarations: [AppComponent],
	bootstrap: [AppComponent],
})
export class AppModule {
	constructor (private _: ThemeService) {}
}
