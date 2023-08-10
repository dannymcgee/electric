import {
	AfterContentInit,
	Component,
	ContentChildren,
	ElementRef,
	OnDestroy,
	OnInit,
	ViewChild,
} from "@angular/core";
import { ElxResizeObserver, QueryList } from "@electric/ng-utils";
import {
	animationFrameScheduler,
	distinctUntilChanged,
	map,
	merge,
	shareReplay,
	startWith,
	Subject,
	switchMap,
	takeUntil,
	throttleTime,
} from "rxjs";

import { nearlyEq } from "../math";
import {
	RenderElement,
	RenderHost,
	RENDER_ELEMENT,
	RENDER_HOST,
} from "./render.types";

@Component({
	selector: "g-canvas",
	templateUrl: "./canvas.renderer.html",
	styleUrls: ["./canvas.renderer.scss"],
	providers: [{
		provide: RENDER_HOST,
		useExisting: CanvasRenderer,
	}],
})
export class CanvasRenderer
	implements RenderHost, OnInit, AfterContentInit, OnDestroy
{
	private _context!: CanvasRenderingContext2D;
	private _update$ = new Subject<CanvasRenderingContext2D>();
	readonly update$ = this._update$.pipe(shareReplay({
		bufferSize: 1,
		refCount: true,
	}));

	@ViewChild("canvas", { static: true, read: ElementRef })
	private _canvasRef!: ElementRef<HTMLCanvasElement>;
	private get _canvas() { return this._canvasRef.nativeElement; }

	@ContentChildren(RENDER_ELEMENT)
	private _elements!: QueryList<RenderElement>;

	private _onDestroy$ = new Subject<void>();

	constructor (
		private _ref: ElementRef<HTMLElement>,
		private _resizeObserver: ElxResizeObserver,
	) {}

	ngOnInit(): void {
		const { offsetWidth: width, offsetHeight: height } = this._ref.nativeElement;
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

					this._update$.next(ctx);
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
		this._update$.complete();
	}

	private render(): void {
		const ctx = this._context;
		ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

		this._update$.next(ctx);
	}
}
