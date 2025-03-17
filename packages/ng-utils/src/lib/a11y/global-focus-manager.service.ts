import { DOCUMENT } from "@angular/common";
import { Inject, Injectable, OnDestroy } from "@angular/core";

import { array, Stack } from "@electric/utils";
import { BehaviorSubject, shareReplay } from "rxjs";

import { Loop } from "../loop";

const $watchForChanges = Symbol("watchForChanges");

@Injectable({
	providedIn: "root",
})
export class GlobalFocusManager implements OnDestroy {
	private _focusHistory = new Stack<HTMLElement>(100);

	private _activeElement$ = new BehaviorSubject<HTMLElement>(this._document.body);
	readonly activeElement$ = this._activeElement$.pipe(shareReplay({
		bufferSize: 1,
		refCount: false,
	}));

	constructor (
		@Inject(DOCUMENT) private _document: Document,
	) {}

	ngOnDestroy(): void {
		this._activeElement$.complete();
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
	[$watchForChanges](): void {
		this.drainNullRefs();

		let last = this._focusHistory.top;
		let current = this._document.activeElement as HTMLElement;

		if (current && current !== this._document.body && current !== last)
			this._focusHistory.push(current);

		if (current && current !== this._activeElement$.value)
			this._activeElement$.next(current);
	}

	private drainNullRefs(): void {
		while (this._focusHistory.length && !this._focusHistory.top) {
			this._focusHistory.pop();
		}
	}
}
