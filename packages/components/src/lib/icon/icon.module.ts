import { ModuleWithProviders, NgModule } from "@angular/core";

import { IconComponent } from "./icon.component";
import { IconRegistry } from "./icon.service";
import { ICON_LIBRARY } from "./icon.types";

@NgModule({
	declarations: [IconComponent],
	exports: [IconComponent],
})
export class IconModule {
	static withIcons(
		library: Record<string, string>
	): ModuleWithProviders<IconModule> {
		return {
			ngModule: IconModule,
			providers: [
				{ provide: ICON_LIBRARY, useValue: library },
				IconRegistry,
			],
		};
	}
}
