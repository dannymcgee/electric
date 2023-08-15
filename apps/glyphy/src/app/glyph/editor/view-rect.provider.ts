import { ElementRef, Injectable, OnDestroy } from "@angular/core";
import { ElxResizeObserver } from "@electric/ng-utils";
import { Const, replayUntil } from "@electric/utils";
import {
	BehaviorSubject,
	debounceTime,
	distinctUntilChanged,
	map,
	merge,
	Observable,
	of,
	Subject,
	takeUntil,
} from "rxjs";

import { IRect, Rect } from "../../math";

@Injectable()
export class ViewRectProvider implements OnDestroy {
	get viewRect() { return this._viewRect$.value; }
	readonly viewRect$: Observable<Const<IRect>>;
	private _viewRect$ = new BehaviorSubject<Const<IRect>>(new Rect(0, 0, 0, 0));

	readonly contentRect$: Observable<Const<IRect>>;
	readonly clientRect$: Observable<Const<IRect>>;

	private _onDestroy$ = new Subject<void>();

	constructor (ref: ElementRef<Element>, resizeObserver: ElxResizeObserver) {
		this.viewRect$ = this._viewRect$.pipe(replayUntil(this._onDestroy$));

		const resize$ = resizeObserver
			.observe(ref)
			.pipe(replayUntil(this._onDestroy$));

		resize$.subscribe({
			complete: () => {
				resizeObserver.unobserve(ref);
			},
		});

		// The client rect is more expensive to retrieve than the content rect,
		// because it triggers a reflow. But if we can retrieve it during some
		// downtime and keep it around for later reference, then `InputProvider`
		// can read accurate pointer positions without triggering reflow by
		// reading the `MouseEvent.offset(X|Y)` properties.
		//
		// For the best of both worlds, we'll take the content rect from resize
		// events as often as they emit, since reading that property is free (I
		// think? I hope?), and on a fairly long debounce, we'll retrieve the full
		// client rect so that we have the x and y offsets available for consumers
		// who need them.
		//
		// Reference: https://gist.github.com/paulirish/5d52fb081b3570c81e3a

		const resizeContentRect$ = resize$.pipe(map(entry => entry.contentRect));
		const resizeClientRect$ = resize$.pipe(
			debounceTime(500),
			map(() => ref.nativeElement.getBoundingClientRect()),
			replayUntil(this._onDestroy$),
		);

		const initClientRect$ = of(ref.nativeElement.getBoundingClientRect())
			.pipe(replayUntil(this._onDestroy$));

		this.clientRect$ = merge(initClientRect$, resizeClientRect$).pipe(
			distinctUntilChanged(Rect.nearlyEq(0.5)),
			replayUntil(this._onDestroy$),
		);

		const initContentRect$ = initClientRect$.pipe(
			map(({ width, height }) => new Rect(0, 0, width, height)),
		);

		this.contentRect$ = merge(initContentRect$, resizeContentRect$).pipe(
			distinctUntilChanged(Rect.nearlyEq(0.5)),
			replayUntil(this._onDestroy$),
		);

		merge(initClientRect$, resizeContentRect$, resizeClientRect$)
			.pipe(
				distinctUntilChanged(Rect.nearlyEq(0.5)),
				takeUntil(this._onDestroy$),
			)
			.subscribe(rect => {
				this._viewRect$.next(rect);
			});
	}

	ngOnDestroy(): void {
		this._onDestroy$.next();
		this._onDestroy$.complete();
		this._viewRect$.complete();
	}
}
