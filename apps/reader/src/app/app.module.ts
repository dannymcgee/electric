import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { BrowserModule } from "@angular/platform-browser";
import {
	AppShellModule,
	ButtonModule,
	DEFAULT_THEME,
	FormControlsModule,
	IconModule,
	MenuModule,
	ThemeModule,
	ThemeService,
} from "@electric/components";
import { UtilityModule } from "@electric/ng-utils";
import { AppPlatform, PlatformModule } from "@electric/platform";
import { ICONS } from "@electric/style";

import { AppComponent } from "./app.component";
import { AssertSafeUrlPipe } from "./assert-safe-url.pipe";
import { BookReaderComponent } from './components/book-reader/book-reader.component';
import { NavPointComponent } from './components/nav-point/nav-point.component';
import { BookSectionComponent } from './components/book-section/book-section.component';

@NgModule({
	declarations: [
		AppComponent,
		AssertSafeUrlPipe,
		BookReaderComponent,
		NavPointComponent,
		BookSectionComponent,
	],
	imports: [
		BrowserModule,
		FormsModule,
		FormControlsModule,
		AppShellModule,
		ButtonModule,
		IconModule.withIcons(ICONS),
		MenuModule,
		PlatformModule.forPlatform(AppPlatform.Tauri),
		ThemeModule.withTheme(DEFAULT_THEME, "dark"),
		UtilityModule,
	],
	providers: [],
	bootstrap: [
		AppComponent,
	],
})
export class AppModule {
	constructor (private _: ThemeService) {}
}
