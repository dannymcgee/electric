import { Component, Inject } from "@angular/core";

import {
	AppPlatform,
	APP_PLATFORM,
	WindowProvider,
	WINDOW_PROVIDER,
} from "@electric/platform";

@Component({
	selector: "showcase-root",
	templateUrl: "./app.component.html",
	styleUrls: ["./app.component.scss"],
})
export class AppComponent {
	get maximized() { return this._window.maximized; }
	set maximized(_) { this._window.toggleMaximized(); }

	get title() {
		let base = "Electric Showcase";
		let middleDot = "\xB7";

		switch (this.platform) {
			case AppPlatform.Web: return base;
			case AppPlatform.Electron: return `${base} ${middleDot} Electron`;
			case AppPlatform.Tauri: return `${base} ${middleDot} Tauri`;
		}
	}

	constructor (
		@Inject(APP_PLATFORM) public platform: AppPlatform,
		@Inject(WINDOW_PROVIDER) private _window: WindowProvider,
	) {}

	async minimize() {
		await this._window.minimize();
	}

	async close() {
		await this._window.close();
	}
}
