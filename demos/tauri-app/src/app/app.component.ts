import { Component, OnDestroy, OnInit } from "@angular/core";
import { appWindow } from "@tauri-apps/api/window";
import { animationFrames, BehaviorSubject, Subject } from "rxjs";
import { distinctUntilChanged, switchMap, takeUntil } from "rxjs/operators";

@Component({
	selector: "app-root",
	templateUrl: "./app.component.html",
	styleUrls: ["./app.component.scss"],
})
export class AppComponent implements OnInit, OnDestroy {
	get maximized() { return this._maximized$.value; }
	set maximized(_) { appWindow.toggleMaximize(); }

	private _maximized$ = new BehaviorSubject<boolean>(false);
	private _onDestroy$ = new Subject<void>();

	ngOnInit(): void {
		animationFrames().pipe(
			switchMap(() => appWindow.isMaximized()),
			distinctUntilChanged(),
			takeUntil(this._onDestroy$),
		).subscribe(maximized => {
			this._maximized$.next(maximized);
		});
	}

	ngOnDestroy(): void {
		this._onDestroy$.next();
		this._onDestroy$.complete();
	}

	async minimize() {
		await appWindow.minimize();
	}

	async close() {
		await appWindow.close();
	}
}
