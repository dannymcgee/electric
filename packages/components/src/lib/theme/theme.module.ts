import { ModuleWithProviders, NgModule } from "@angular/core";

import { COLOR_SCHEME, THEME, ThemeService } from "./theme.service";
import { ColorSchemeName, ThemeDefinition } from "./theme.types";

@NgModule({})
export class ThemeModule {
	static withTheme(
		theme: ThemeDefinition,
		initialScheme: ColorSchemeName,
	): ModuleWithProviders<ThemeModule> {
		return {
			ngModule: ThemeModule,
			providers: [
				{ provide: THEME, useValue: theme },
				{ provide: COLOR_SCHEME, useValue: initialScheme },
				ThemeService,
			],
		};
	}
}
