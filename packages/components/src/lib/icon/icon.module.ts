import { ModuleWithProviders, NgModule } from "@angular/core";
import { IconMap, SvgIconsConfig } from "@electric/style";

import { IconComponent } from "./icon.component";
import { IconRegistry } from "./icon.service";
import { SVG_ICONS_CONFIG } from "./icon.types";

@NgModule({
	declarations: [IconComponent],
	exports: [IconComponent],
})
export class IconModule {
	static withConfig<T extends IconMap>(
		config: SvgIconsConfig<T>
	): ModuleWithProviders<IconModule> {
		return {
			ngModule: IconModule,
			providers: [
				{ provide: SVG_ICONS_CONFIG, useValue: config },
				IconRegistry,
			],
		};
	}
}
