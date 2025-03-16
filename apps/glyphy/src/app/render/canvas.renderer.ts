import { ChangeDetectionStrategy } from "@angular/core";
import {
	AfterContentInit,
	Component,
	ContentChildren,
	ElementRef,
	EventEmitter,
	OnDestroy,
	OnInit,
	Output,
} from "@angular/core";
import { QueryList } from "@electric/ng-utils";
// import { animationFrames } from "@electric/utils";
import {
	// animationFrameScheduler,
	// merge,
	// shareReplay,
	// startWith,
	Subject,
	// switchMap,
	// takeUntil,
	// throttleTime,
} from "rxjs";
// import { ViewRectProvider } from "../glyph/editor";

import { RenderElement, RENDER_ELEMENT } from "./render.types";

@Component({
	selector: "canvas[g-canvas]",
	template: `<ng-content></ng-content>`,
	changeDetection: ChangeDetectionStrategy.Default,
})
export class CanvasRenderer implements OnInit, AfterContentInit, OnDestroy {
	@Output() update = new EventEmitter<void>();

	@ContentChildren(RENDER_ELEMENT)
	private _elements!: QueryList<RenderElement>;

	private get _canvas() { return this._ref.nativeElement; }
	private _context!: CanvasRenderingContext2D;

	private _onDestroy$ = new Subject<void>();

	constructor (
		private _ref: ElementRef<HTMLCanvasElement>,
		// private _rect: ViewRectProvider,
	) {}

	ngOnInit(): void {
		const { offsetWidth: width, offsetHeight: height } = this._canvas;
		this._canvas.width = width * devicePixelRatio;
		this._canvas.height = height * devicePixelRatio;

		this._context = this._canvas.getContext("2d")!;
		if (!this._context)
			throw new Error("Failed to create canvas rendering context");

		// FIXME: For unknown reasons, as of Angular 14 we are no longer getting
		//        notified of updates on every frame where they occur. It seems
		//        like `ngOnChanges` is only getting invoked about once every
		//        115ms despite there being per-frame changes when we're panning
		//        the view, etc. I didn't see anything in Angular's migration
		//        notes about this, so it's possible I'm doing something wrong and
		//        it was only incidentally working before. For now, I guess we
		//        just go full "immediate mode." :/
		// -----------------------------------------------------------------------
		// this._rect.contentRect$.subscribe(({ width, height }) => {
		// 	this._canvas.width = width * devicePixelRatio;
		// 	this._canvas.height = height * devicePixelRatio;
		//
		// 	this.render();
		// });

		// FIXME some more: Even this only runs about 10 times per second. And
		//       it's not because of some bottleneck -- the profiler shows nothing
		//       but idle time inbetween `render` calls. To get anything
		//       approaching a realtime UX I have to completely bypass the Angular
		//       runtime and just run an infinite RAF loop. What the fuck?
		// -----------------------------------------------------------------------
		// animationFrames()
		// 	.pipe(takeUntil(this._onDestroy$))
		// 	.subscribe(() => {
		// 		this.render();
		// 	});

		// FIXME: This component is not a singleton, so this will just leak memory
		//        like a sieve.
		const loop = () => {
			this.render();
			requestAnimationFrame(loop);
		}
		requestAnimationFrame(loop);
	}

	// FIXME: See notes above
	// eslint-disable-next-line @angular-eslint/no-empty-lifecycle-method
	ngAfterContentInit(): void {
		// const elements$ = this._elements.changes.pipe(
		// 	startWith(this._elements),
		// 	shareReplay({ bufferSize: 1, refCount: true }),
		// 	takeUntil(this._onDestroy$),
		// );

		// const elementChanges$ = elements$.pipe(
		// 	switchMap(ql => merge(...ql.map(el => el.changes$))),
		// 	takeUntil(this._onDestroy$),
		// );

		// merge(elements$, elementChanges$)
		// 	.pipe(
		// 		throttleTime(0, animationFrameScheduler, {
		// 			leading: true,
		// 			trailing: true,
		// 		}),
		// 		takeUntil(this._onDestroy$),
		// 	)
		// 	.subscribe(() => {
		// 		this.render();
		// 	});
	}

	ngOnDestroy(): void {
		this._onDestroy$.next();
		this._onDestroy$.complete();
	}

	private render(): void {
		let start = performance.mark("CanvasRenderer.render.start");

		const ctx = this._context;
		ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

		if (this._elements)
			for (let element of this._elements)
				element.onDraw(ctx);

		this.update.emit();

		let end = performance.mark("CanvasRenderer.render.end");
		performance.measure("CanvasRenderer.render", start.name, end.name);
		// Profiler shows ~1ms per render call and ~100ms downtime between calls.
		// I'm at a complete loss.
	}
}
