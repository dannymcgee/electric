import { InjectionToken } from "@angular/core";

export enum AppPlatform {
	Electron = "electron",
	Tauri = "tauri",
	Web = "web",
}

export const APP_PLATFORM = new InjectionToken<AppPlatform>("AppPlatform");
