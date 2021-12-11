import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";

import { AccordionModule } from "@electric/components/accordion";
import { AppShellModule } from "@electric/components/app-shell";
import { ButtonModule } from "@electric/components/button";
import { DialogModule } from "@electric/components/dialog";
import { FormControlsModule } from "@electric/components/form-controls";
import { IconModule } from "@electric/components/icon";
import { MenuModule } from "@electric/components/menu";
import { PlatformModule } from "@electric/platform";
import {
	ThemeModule,
	DEFAULT_THEME,
	ThemeService,
} from "@electric/components/theme";
import { ICONS } from "@electric/style";

import { ENV_PLATFORM } from "../environments/env-platform";
import { AppComponent } from "./app.component";
import { CodeExampleComponent } from './code-example/code-example.component';
import { ButtonExample } from "./examples/button.example";

@NgModule({
	imports: [
		// Angular modules
		BrowserModule,
		BrowserAnimationsModule,
		FormsModule,
		// Electric modules
		AccordionModule,
		AppShellModule,
		ButtonModule,
		DialogModule,
		FormControlsModule,
		IconModule.withIcons(ICONS),
		MenuModule,
		PlatformModule.forPlatform(ENV_PLATFORM),
		ThemeModule.withTheme(DEFAULT_THEME, "dark"),
	],
	declarations: [
		AppComponent,
		CodeExampleComponent,
		ButtonExample,
	],
	bootstrap: [
		AppComponent,
	],
})
export class AppModule {
	constructor (private _: ThemeService) {}
}
