import { Injectable } from "@angular/core";

@Injectable({
	providedIn: "root",
})
export class HistoryService {
	private _history: string[] = [];
	private _ptr = -1;

	get canGoBack() { return this._ptr > 0; }
	get canGoForward() { return this._ptr < (this._history.length - 1); }

	push(path: string) {
		while (this.canGoForward)
			this._history.pop();

		this._history.push(path);
		++this._ptr;
	}

	forward(): string | null {
		if (!this.canGoForward)
			return null;

		return this._history[++this._ptr];
	}

	back(): string | null {
		if (!this.canGoBack)
			return null;

		return this._history[--this._ptr];
	}
}
