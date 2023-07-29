import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";

import {
	AppShellModule,
	ButtonModule,
	DEFAULT_THEME,
	DialogModule,
	IconModule,
	MenuModule,
	ThemeModule,
	ThemeService,
} from "@electric/components";
import { A11yModule, ElxResizeObserver, UtilityModule } from "@electric/ng-utils";
import { AppPlatform, PlatformModule } from "@electric/platform";
import { ICONS } from "@electric/style";

import {
	AppComponent,
} from "./app.component";
import {
	GlyphComponent,
	GlyphEditorComponent,
	GlyphMetricsComponent,
	GlyphToSvgPipe,
} from "./glyph";
import { CffProgramPipe, FontToSvgViewBoxPipe, HexPipe } from "./util";

@NgModule({
	imports: [
		// Angular modules
		BrowserModule,
		BrowserAnimationsModule,
		// Electric modules
		A11yModule,
		AppShellModule,
		ButtonModule,
		DialogModule,
		IconModule.withIcons(ICONS),
		MenuModule,
		PlatformModule.forPlatform(AppPlatform.Tauri),
		ThemeModule.withTheme(DEFAULT_THEME, "dark"),
		UtilityModule,
	],
	declarations: [
		AppComponent,
		CffProgramPipe,
		FontToSvgViewBoxPipe,
		GlyphComponent,
		GlyphEditorComponent,
		GlyphMetricsComponent,
		GlyphToSvgPipe,
		HexPipe,
	],
	bootstrap: [
		AppComponent,
	],
	providers: [
		ElxResizeObserver,
	],
})
export class AppModule {
	constructor (private _: ThemeService) {}
}
