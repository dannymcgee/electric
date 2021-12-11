import { Injectable, OnDestroy } from "@angular/core";
import { BehaviorSubject, Observable, Subject, takeUntil } from "rxjs";

@Injectable()
export class OverlayData implements OnDestroy {
	optionHeight = 0;
	activeIndex$ = new BehaviorSubject<number>(-1);

	private _onDestroy$ = new Subject<void>();

	ngOnDestroy(): void {
		this._onDestroy$.next();
		this._onDestroy$.complete();
		this.activeIndex$.complete();
	}

	connect(activeIndex$: Observable<number>): void {
		activeIndex$
			.pipe(takeUntil(this._onDestroy$))
			.subscribe(next => {
				this.activeIndex$.next(next);
			});
	}
}
