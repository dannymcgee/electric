import { Injectable, OnDestroy } from "@angular/core";
import { BehaviorSubject, Observable, Subject, takeUntil } from "rxjs";

@Injectable()
export class OptionListOverlayData implements OnDestroy {
	optionHeight = 0;
	optionCount = 0;
	maxDisplayCount = 9;

	private _activeIndex$ = new BehaviorSubject<number>(-1);
	activeIndex$ = this._activeIndex$.asObservable();

	get activeIndex() { return this._activeIndex$.value; }
	set activeIndex(value) { this._activeIndex$.next(value); }

	private _onDestroy$ = new Subject<void>();

	ngOnDestroy(): void {
		this._onDestroy$.next();
		this._onDestroy$.complete();
		this._activeIndex$.complete();
	}

	connect(activeIndex$: Observable<number>): void {
		activeIndex$
			.pipe(takeUntil(this._onDestroy$))
			.subscribe(next => {
				this._activeIndex$.next(next);
			});
	}
}
