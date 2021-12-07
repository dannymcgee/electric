import { ModuleWithProviders, NgModule } from "@angular/core";

import { AppPlatform, APP_PLATFORM } from "./platform.types";
import { WindowProviderFactory, WINDOW_PROVIDER } from "./window";

@NgModule({})
export class PlatformModule {
	static forPlatform(
		platform: AppPlatform
	): ModuleWithProviders<PlatformModule> {
		return {
			ngModule: PlatformModule,
			providers: [{
				provide: APP_PLATFORM,
				useValue: platform,
			}, {
				provide: WINDOW_PROVIDER,
				useFactory: WindowProviderFactory,
				deps: [APP_PLATFORM],
			}],
		};
	}
}
