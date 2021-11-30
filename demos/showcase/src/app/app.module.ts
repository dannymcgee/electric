import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { ButtonModule } from "@electric/components/button";
import { ThemeModule, DEFAULT_THEME, ThemeService } from "@electric/components/theme";

import { AppComponent } from "./app.component";

@NgModule({
	imports: [
		BrowserModule,
		ButtonModule,
		ThemeModule.withTheme(DEFAULT_THEME, "dark"),
	],
	declarations: [
		AppComponent,
	],
	bootstrap: [
		AppComponent,
	],
})
export class AppModule {
	constructor (private _: ThemeService) {}
}
