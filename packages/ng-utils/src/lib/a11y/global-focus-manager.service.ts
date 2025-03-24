import { DOCUMENT } from "@angular/common";
import { inject, Injectable, OnDestroy } from "@angular/core";

import { array, Stack } from "@electric/utils";
import { BehaviorSubject, shareReplay } from "rxjs";

import { Loop } from "../loop";

const $watchForChanges = Symbol("watchForChanges");

@Injectable({
	providedIn: "root",
})
export class GlobalFocusManager implements OnDestroy {
	#focusHistory = new Stack<HTMLElement>(100);
	#document = inject(DOCUMENT);

	#activeElement$ = new BehaviorSubject<HTMLElement>(this.#document.body);
	readonly activeElement$ = this.#activeElement$.pipe(shareReplay({
		bufferSize: 1,
		refCount: false,
	}));

	ngOnDestroy(): void {
		this.#activeElement$.complete();
	}

	getLastValidFocusTarget(): HTMLElement | null {
		this.drainNullRefs();

		if (!this.#focusHistory.length) {
			return null;
		}

		let liveElements = array(this.#document.querySelectorAll("*"));
		let candidate = this.#focusHistory.pop();

		while (candidate != null && !liveElements.includes(candidate)) {
			candidate = this.#focusHistory.pop();
		}

		return candidate ?? null;
	}

	@Loop()
	[$watchForChanges](): void {
		this.drainNullRefs();

		let last = this.#focusHistory.top;
		let current = this.#document.activeElement as HTMLElement;

		if (current && current !== this.#document.body && current !== last)
			this.#focusHistory.push(current);

		if (current && current !== this.#activeElement$.value)
			this.#activeElement$.next(current);
	}

	private drainNullRefs(): void {
		while (this.#focusHistory.length && !this.#focusHistory.top) {
			this.#focusHistory.pop();
		}
	}
}
