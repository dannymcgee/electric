import { Injectable, OnDestroy } from "@angular/core";
import { sleep } from "@electric/utils";
import type { WebviewWindow } from "@tauri-apps/api/window";
import {
	animationFrames,
	BehaviorSubject,
	distinctUntilChanged,
	firstValueFrom,
	Observable,
	skip,
	Subject,
	switchMap,
	takeUntil,
} from "rxjs";

import { WindowProvider } from "./window.types";

@Injectable()
export class TauriWindowService implements WindowProvider, OnDestroy {
	get maximized$() {
		return this._maximized$ ??= this._maximizedSubject$.asObservable();
	}
	private _maximized$?: Observable<boolean>;
	private _maximizedSubject$ = new BehaviorSubject<boolean>(false);

	get maximized() { return this._maximizedSubject$.value; }

	private _window?: WebviewWindow;
	private _onDestroy$ = new Subject<void>();

	constructor () {
		import("@tauri-apps/api/window")
			.then(({ appWindow }) => {
				this._window = appWindow;

				animationFrames().pipe(
					switchMap(() => appWindow.isMaximized()),
					distinctUntilChanged(),
					takeUntil(this._onDestroy$),
				).subscribe(maximized => {
					this._maximizedSubject$.next(maximized);
				});
			})
			.catch(console.error);
	}

	ngOnDestroy(): void {
		this._onDestroy$.next();
		this._onDestroy$.complete();
		this._maximizedSubject$.complete();
	}

	async minimize() {
		while (!this._window) {
			await sleep(10);
		}
		return this._window.minimize();
	}

	async toggleMaximized() {
		while (!this._window) {
			await sleep(10);
		}
		await this._window.toggleMaximize();
		return firstValueFrom(this.maximized$.pipe(skip(1)));
	}

	async close() {
		while (!this._window) {
			await sleep(10);
		}
		return this._window.close();
	}
}
