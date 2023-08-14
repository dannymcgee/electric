import { ElementRef, Injectable, OnDestroy } from "@angular/core";
import { Const, delta, replayUntil } from "@electric/utils";
import {
	BehaviorSubject,
	filter,
	fromEvent,
	map,
	ReplaySubject,
	withLatestFrom,
} from "rxjs";

import { vec2, Vec2 } from "../../math";
import { ViewRectProvider } from "./view-rect.provider";

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
		private _rect: ViewRectProvider,
	) {
		fromEvent<PointerEvent>(_ref.nativeElement, "pointermove")
			.pipe(
				withLatestFrom(this._rect.viewRect$),
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
	}

	ptrDown(button = 0) {
		return this._ptrBtnsDown$.pipe(filter(btns => btns.has(button)));
	}

	ptrUp(button = 0) {
		return this._ptrBtnsDown$.pipe(filter(btns => !btns.has(button)));
	}

	ptrMove() {
		return fromEvent<PointerEvent>(this._ref.nativeElement, "pointermove").pipe(
			map(({ clientX, clientY }) => vec2(clientX, clientY)),
			delta({ diff: vec2.sub, zero: Vec2.zero }),
		);
	}
}
