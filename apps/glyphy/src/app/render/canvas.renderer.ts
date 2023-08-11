import {
	AfterContentInit,
	Component,
	ContentChildren,
	ElementRef,
	OnDestroy,
	OnInit,
} from "@angular/core";
import { ElxResizeObserver, QueryList } from "@electric/ng-utils";
import {
	animationFrameScheduler,
	distinctUntilChanged,
	map,
	merge,
	startWith,
	Subject,
	switchMap,
	takeUntil,
	throttleTime,
} from "rxjs";

import { nearlyEq } from "../math";
import { RenderElement, RENDER_ELEMENT } from "./render.types";

@Component({
	selector: "canvas[g-canvas]",
	template: `<ng-content></ng-content>`,
})
export class CanvasRenderer implements OnInit, AfterContentInit, OnDestroy {
	@ContentChildren(RENDER_ELEMENT)
	private _elements!: QueryList<RenderElement>;

	private get _canvas() { return this._ref.nativeElement; }
	private _context!: CanvasRenderingContext2D;

	private _onDestroy$ = new Subject<void>();

	constructor (
		private _ref: ElementRef<HTMLCanvasElement>,
		private _resizeObserver: ElxResizeObserver,
	) {}

	ngOnInit(): void {
		const { offsetWidth: width, offsetHeight: height } = this._canvas;
		this._canvas.width = width * devicePixelRatio;
		this._canvas.height = height * devicePixelRatio;

		this._context = this._canvas.getContext("2d", { willReadFrequently: true })!;
		if (!this._context)
			throw new Error("Failed to create canvas rendering context");

		this._resizeObserver
			.observe(this._ref)
			.pipe(
				map(entry => entry.contentRect),
				distinctUntilChanged((a, b) => (
					nearlyEq(a.width, b.width)
					&& nearlyEq(a.height, b.height)
				)),
				takeUntil(this._onDestroy$),
			)
			.subscribe({
				next: ({ width, height }) => {
					const ctx = this._context;
					ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

					ctx.canvas.width = width * devicePixelRatio;
					ctx.canvas.height = height * devicePixelRatio;

					this.render();
				},
				complete: () => {
					this._resizeObserver.unobserve(this._ref);
				},
			});
	}

	ngAfterContentInit(): void {
		const elements$ = this._elements.changes.pipe(
			startWith(this._elements),
			takeUntil(this._onDestroy$),
		);

		const elementChanges$ = elements$.pipe(
			switchMap(ql => merge(...ql.map(el => el.changes$))),
			takeUntil(this._onDestroy$),
		);

		merge(elements$, elementChanges$)
			.pipe(
				throttleTime(0, animationFrameScheduler, {
					leading: true,
					trailing: true,
				}),
				takeUntil(this._onDestroy$),
			)
			.subscribe(() => {
				this.render();
			});
	}

	ngOnDestroy(): void {
		this._onDestroy$.next();
		this._onDestroy$.complete();
	}

	private render(): void {
		// console.log(
		// 	`CanvasRenderer.render [${this._canvas.width} x ${this._canvas.height}]`,
		// 	this._elements.toArray(),
		// );

		const ctx = this._context;
		ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

		for (let element of this._elements)
			element.onDraw(ctx);
	}
}
