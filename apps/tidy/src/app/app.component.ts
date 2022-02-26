import { Component, Inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { WindowProvider, WINDOW_PROVIDER } from "@electric/platform";
import { Entry } from "@tidy-api";
import { map } from "rxjs";

@Component({
	selector: "tidy-root",
	templateUrl: "./app.component.html",
	styleUrls: ["./app.component.scss"],
})
export class AppComponent {
	entries$ = this._http
		.post<Entry[]>("/api", { dir: "C:/" })
		.pipe(map(sort));

	get maximized() { return this._window.maximized; }
	set maximized(_) { this._window.toggleMaximized(); }

	constructor (
		private _http: HttpClient,
		@Inject(WINDOW_PROVIDER) private _window: WindowProvider,
	) {}

	async minimize() {
		await this._window.minimize();
	}

	async close() {
		await this._window.close();
	}
}

function sort(entries: Entry[]) {
	return entries.slice().sort((a, b) => {
		if (a.type === "folder" && b.type !== "folder") return -1;
		if (a.type !== "folder" && b.type === "folder") return 1;

		// if (!a.size && !!b.size)
		// 	return a.type === "folder" ? -1 : 1;
		// if (!!a.size && !b.size)
		// 	return a.type === "folder" ? 1 : -1;

		// if (a.size !== b.size)
		// 	return b.size - a.size;

		return a.basename.localeCompare(b.basename);
	});
}
