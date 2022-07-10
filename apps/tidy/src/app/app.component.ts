import { Component, Inject, OnInit } from "@angular/core";
import { WindowProvider, WINDOW_PROVIDER } from "@electric/platform";
import { HistoryService } from "./history.service";

@Component({
	selector: "tidy-root",
	templateUrl: "./app.component.html",
	styleUrls: ["./app.component.scss"],
})
export class AppComponent implements OnInit {
	private _path = "C:/";
	get path() { return this._path; }
	set path(value) {
		this._path = value;
		this._history.push(value);
	}

	get canGoBack() { return this._history.canGoBack; }
	get canGoForward() { return this._history.canGoForward; }

	get maximized() { return this._window.maximized; }
	set maximized(_) { this._window.toggleMaximized(); }

	constructor (
		private _history: HistoryService,
		@Inject(WINDOW_PROVIDER) private _window: WindowProvider,
	) {}

	ngOnInit(): void {
		this._history.push(this.path);
	}

	async minimize() {
		await this._window.minimize();
	}

	async close() {
		await this._window.close();
	}

	back(): void {
		let path = this._history.back();
		if (path) {
			this._path = path;
		}
	}

	forward(): void {
		let path = this._history.forward();
		if (path) {
			this._path = path;
		}
	}
}
