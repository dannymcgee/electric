import { ElementRef, Injectable, OnDestroy } from "@angular/core";
import { ElxResizeObserver } from "@electric/ng-utils";
import { Const, replayUntil } from "@electric/utils";
import {
	BehaviorSubject,
	filter,
	fromEvent,
	map,
	merge,
	of,
	ReplaySubject,
	withLatestFrom,
} from "rxjs";

import { vec2, Vec2 } from "../../math";

@Injectable()
export class InputProvider implements OnDestroy {
	private _keysDown$ = new BehaviorSubject(new Set<string>());
	readonly keysDown$ = this._keysDown$.asObservable();
	get keysDown() { return this._keysDown$.value; }

	private _ptrBtnsDown$ = new BehaviorSubject(new Set<number>());
	readonly ptrBtnsDown$ = this._ptrBtnsDown$.asObservable();
	get ptrBtnsDown() { return this._ptrBtnsDown$.value; }

	private _ptrLocation$ = new BehaviorSubject<Const<Vec2>>(vec2(-1, -1));
	readonly ptrLocation$ = this._ptrLocation$.asObservable();
	get ptrLocation() { return this._ptrLocation$.value; }

	private _onDestroy$ = new ReplaySubject<void>(1);

	constructor (
		private _ref: ElementRef<Element>,
		private _resizeObserver: ElxResizeObserver,
	) {
		const resizeClientRect$ = _resizeObserver.observe(_ref)
			.pipe(
				map(() => _ref.nativeElement.getBoundingClientRect()),
				replayUntil(this._onDestroy$),
			);

		const initClientRect$ = of(_ref.nativeElement.getBoundingClientRect())
			.pipe(replayUntil(this._onDestroy$));

		fromEvent<PointerEvent>(_ref.nativeElement, "pointermove")
			.pipe(
				withLatestFrom(merge(initClientRect$, resizeClientRect$)),
				map(([ptr, view]) => vec2(ptr.clientX-view.x, ptr.clientY-view.y)),
				replayUntil(this._onDestroy$),
			)
			.subscribe(coords => {
				this._ptrLocation$.next(coords);
			});

		fromEvent<KeyboardEvent>(document, "keydown")
			.pipe(replayUntil(this._onDestroy$))
			.subscribe(event => {
				if (event.key === "Alt")
					event.preventDefault();

				const set = this._keysDown$.value;
				if (set.has(event.key)) return;

				set.add(event.key);
				this._keysDown$.next(set);
			});

		fromEvent<KeyboardEvent>(document, "keyup")
			.pipe(replayUntil(this._onDestroy$))
			.subscribe(event => {
				const set = this._keysDown$.value;
				set.delete(event.key);
				this._keysDown$.next(set);
			});

		fromEvent<PointerEvent>(_ref.nativeElement, "pointerdown")
			.pipe(replayUntil(this._onDestroy$))
			.subscribe(event => {
				const set = this._ptrBtnsDown$.value;
				set.add(event.button);
				this._ptrBtnsDown$.next(set);
			});

		fromEvent<PointerEvent>(_ref.nativeElement, "pointerup")
			.pipe(replayUntil(this._onDestroy$))
			.subscribe(event => {
				const set = this._ptrBtnsDown$.value;
				set.delete(event.button);
				this._ptrBtnsDown$.next(set);
			});
	}

	ngOnDestroy(): void {
		this._onDestroy$.next();
		this._onDestroy$.complete();

		this._keysDown$.complete();
		this._ptrBtnsDown$.complete();
		this._ptrLocation$.complete();

		this._resizeObserver.unobserve(this._ref);
	}

	ptrDown(button = 0) {
		return this._ptrBtnsDown$.pipe(filter(btns => btns.has(button)));
	}

	ptrUp(button = 0) {
		return this._ptrBtnsDown$.pipe(filter(btns => !btns.has(button)));
	}
}
