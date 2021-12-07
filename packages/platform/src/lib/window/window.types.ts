import { InjectionToken } from "@angular/core";
import { Observable } from "rxjs";

import { AppPlatform } from "../platform.types";
import { ElectronWindowService } from "./electron-window.service";
import { NoopWindowService } from "./noop-window.service";
import { TauriWindowService } from "./tauri-window.service";

export interface WindowProvider {
	readonly maximized$: Observable<boolean>;
	readonly maximized: boolean;

	minimize(): Promise<void>;
	close(): Promise<void>;
	toggleMaximized(): Promise<boolean>;
}

export const WINDOW_PROVIDER = new InjectionToken<WindowProvider>("WindowProvider");

export function WindowProviderFactory(platform: AppPlatform): WindowProvider {
	switch (platform) {
		case AppPlatform.Electron: return new ElectronWindowService();
		case AppPlatform.Tauri: return new TauriWindowService();
		case AppPlatform.Web: return new NoopWindowService();
	}
}
