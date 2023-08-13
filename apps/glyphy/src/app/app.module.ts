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
	GlyphContourComponent,
	GlyphEditor2Component,
	GlyphEditorComponent,
	GlyphMetricsComponent,
} from "./glyph";
import {
	ContourEditorTool,
	MetricsRenderer,
	OutlinePointsRenderer,
} from "./glyph/editor";
import { HybridCoordSpaceTransformDirective, TransformDirective } from "./math";
import {
	CanvasRenderer,
	LineRenderer,
	PathRenderer,
	PointRenderer,
	RectRenderer,
} from "./render";
import {
	CffProgramPipe,
	HexPipe,
	ViewBoxDirective,
} from "./util";

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
		CanvasRenderer,
		CffProgramPipe,
		ContourEditorTool,
		FamilyPanelComponent,
		FontExplorerComponent,
		GlyphComponent,
		GlyphContourComponent,
		GlyphEditorComponent,
		GlyphEditor2Component,
		GlyphMetricsComponent,
		HexPipe,
		HybridCoordSpaceTransformDirective,
		LineRenderer,
		MetricsRenderer,
		NewFamilyDialog,
		OutlinePointsRenderer,
		ParentFolderExistsValidator,
		PathRenderer,
		PointRenderer,
		RectRenderer,
		TargetFolderIsNewValidator,
		TransformDirective,
		ViewBoxDirective,
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
