import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";

import {
	AppShellModule,
	ButtonModule,
	DEFAULT_THEME,
	DialogModule,
	FormControlsModule,
	IconModule,
	MenuModule,
	TabsModule,
	ThemeModule,
	ThemeService,
} from "@electric/components";
import {
	A11yModule,
	ElxResizeObserver,
	GlobalFocusManager,
	UtilityModule,
} from "@electric/ng-utils";
import { AppPlatform, PlatformModule } from "@electric/platform";
import { ICONS } from "@electric/style";

import {
	AppComponent,
} from "./app.component";
import {
	FamilyPanelComponent,
	NewFamilyDialog,
	ParentFolderExistsValidator,
	TargetFolderIsNewValidator,
} from "./family";
import { FontExplorerComponent } from "./font";
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
		FormsModule,
		// Electric modules
		A11yModule,
		AppShellModule,
		ButtonModule,
		DialogModule,
		FormControlsModule,
		IconModule.withIcons(ICONS),
		MenuModule,
		PlatformModule.forPlatform(AppPlatform.Tauri),
		TabsModule,
		ThemeModule.withTheme(DEFAULT_THEME, "dark"),
		UtilityModule,
	],
	declarations: [
		AppComponent,
		CffProgramPipe,
		FamilyPanelComponent,
		FontExplorerComponent,
		FontToSvgViewBoxPipe,
		GlyphComponent,
		GlyphEditorComponent,
		GlyphMetricsComponent,
		GlyphToSvgPipe,
		HexPipe,
		NewFamilyDialog,
		ParentFolderExistsValidator,
		TargetFolderIsNewValidator,
	],
	bootstrap: [
		AppComponent,
	],
	providers: [
		ElxResizeObserver,
	],
})
export class AppModule {
	constructor (
		private _: GlobalFocusManager,
		private __: ThemeService,
	) {}
}