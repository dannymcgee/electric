import { DOCUMENT } from "@angular/common";
import { Inject, Injectable } from "@angular/core";

import { array, Stack } from "@electric/utils";

import { Loop } from "../loop";

@Injectable({
	providedIn: "root",
})
export class GlobalFocusManager {
	private _focusHistory = new Stack<HTMLElement>(100);

	constructor (
		@Inject(DOCUMENT) private _document: Document,
	) {
		this.watchForChanges();
	}

	getLastValidFocusTarget(): HTMLElement | null {
		this.drainNullRefs();

		if (!this._focusHistory.length) {
			return null;
		}

		let liveElements = array(this._document.querySelectorAll("*"));
		let candidate = this._focusHistory.pop();

		while (candidate != null && !liveElements.includes(candidate)) {
			candidate = this._focusHistory.pop();
		}

		return candidate ?? null;
	}

	@Loop()
	private watchForChanges(): void {
		this.drainNullRefs();

		let last = this._focusHistory.top;
		let current = this._document.activeElement as HTMLElement;

		if (current && current !== this._document.body && current !== last) {
			this._focusHistory.push(current);
		}
	}

	private drainNullRefs(): void {
		while (this._focusHistory.length && !this._focusHistory.top) {
			this._focusHistory.pop();
		}
	}
}
