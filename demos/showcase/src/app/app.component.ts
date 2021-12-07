import { Component, Inject } from "@angular/core";

import {
	AppPlatform,
	APP_PLATFORM,
	WindowProvider,
	WINDOW_PROVIDER,
} from "@electric/platform";
import { Loop } from "@electric/ng-utils";
import { Fn } from "@electric/utils";

@Component({
	selector: "elx-root",
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

	timer?: Timer;
	blocking = false;
	nonBlocking = false;
	warning = false;
	indeterminate = false;

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

	log(message: string): void {
		console.log(message);
	}

	startTimer(seconds: number) {
		this.timer = new Timer(this.stopTimer, seconds);
	}

	stopTimer = () => {
		this.timer?.cancel();
		this.timer = undefined;
	}
}

class Timer {
	get total() { return this._seconds; }
	get current() { return this._current; }

	private _current = 0;
	private _cancelled = false;

	constructor (
		private onComplete: Fn,
		private _seconds: number,
	) {
		this.tick();
	}

	cancel() {
		this._cancelled = true;
	}

	@Loop()
	private tick(deltaTime = 0): void | false {
		if (this._cancelled) {
			return false;
		}

		this._current += deltaTime;
		if (this.current >= this.total) {
			this.onComplete();

			return false;
		}
	}
}
