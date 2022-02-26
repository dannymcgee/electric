import { CdkTableModule } from "@angular/cdk/table";
import { HttpClientModule } from "@angular/common/http";
import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";

import { AppShellModule } from "@electric/components/app-shell";
import { ButtonModule } from "@electric/components/button";
import { IconModule } from "@electric/components/icon";
import { MenuModule } from "@electric/components/menu";
import { ResizeHandleModule } from "@electric/components/resize-handle";
import { DEFAULT_THEME, ThemeModule, ThemeService } from '@electric/components/theme';
import { AppPlatform, PlatformModule } from "@electric/platform";
import { ICONS } from "@electric/style";

import { AppComponent } from "./app.component";
import { FileSizePipe } from "./files/file-size.pipe";
import { FileIcon } from './files/file-icon.component';
import { FileTypePipe } from "./files/file-type.pipe";

@NgModule({
	declarations: [
		AppComponent,
		FileIcon,
		FileTypePipe,
		FileSizePipe,
	],
	imports: [
		BrowserModule,
		BrowserAnimationsModule,
		CdkTableModule,
		HttpClientModule,
		FormsModule,
		AppShellModule,
		ButtonModule,
		IconModule.withIcons(ICONS),
		MenuModule,
		PlatformModule.forPlatform(AppPlatform.Tauri),
		ResizeHandleModule,
		ThemeModule.withTheme(DEFAULT_THEME, "dark"),
	],
	providers: [],
	bootstrap: [
		AppComponent,
	],
	exports: [
   FileIcon
	],
})
export class AppModule {
	constructor (private _: ThemeService) {}
}
