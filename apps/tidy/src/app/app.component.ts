import { Component, Inject } from "@angular/core";
import { WindowProvider, WINDOW_PROVIDER } from "@electric/platform";

@Component({
	selector: "tidy-root",
	templateUrl: "./app.component.html",
	styleUrls: ["./app.component.scss"],
})
export class AppComponent {
	path = "C:/";

	get maximized() { return this._window.maximized; }
	set maximized(_) { this._window.toggleMaximized(); }

	constructor (
		@Inject(WINDOW_PROVIDER) private _window: WindowProvider,
	) {}

	async minimize() {
		await this._window.minimize();
	}

	async close() {
		await this._window.close();
	}
}
