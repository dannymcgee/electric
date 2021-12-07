import { Injectable, InjectionToken, OnDestroy } from "@angular/core";
import type { WebviewWindow } from "@tauri-apps/api/window";
import {
	animationFrames,
	BehaviorSubject,
	distinctUntilChanged,
	firstValueFrom,
	Observable,
	of,
	skip,
	Subject,
	switchMap,
	takeUntil,
} from "rxjs";

import { sleep } from "@electric/utils";

import { AppPlatform } from "./platform.types";

export interface WindowProvider {
	readonly maximized$: Observable<boolean>;
	readonly maximized: boolean;

	minimize(): Promise<void>;
	close(): Promise<void>;
	toggleMaximized(): Promise<boolean>;
}

export const WINDOW_PROVIDER = new InjectionToken<WindowProvider>("WindowProvider");

export function WindowProviderFactory(platform: AppPlatform): WindowProvider {
	switch (platform) {
		case AppPlatform.Electron: return new ElectronWindowService();
		case AppPlatform.Tauri: return new TauriWindowService();
		case AppPlatform.Web: return new NoopWindowService();
	}
}

@Injectable()
export class NoopWindowService implements WindowProvider {
	readonly maximized$ = of(false);
	readonly maximized = false;

	async minimize() {}
	async close() {}
	async toggleMaximized() {
		return false;
	}
}

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

// TODO
@Injectable()
export class ElectronWindowService implements WindowProvider {
	maximized$!: Observable<boolean>;
	maximized!: boolean;

	minimize(): Promise<void> {
		throw new Error("Method not implemented.");
	}

	close(): Promise<void> {
		throw new Error("Method not implemented.");
	}

	toggleMaximized(): Promise<boolean> {
		throw new Error("Method not implemented.");
	}
}
