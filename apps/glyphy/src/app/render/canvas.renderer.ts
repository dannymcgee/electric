import {
	AfterContentInit,
	ChangeDetectionStrategy,
	Component,
	ContentChildren,
	EventEmitter,
	inject,
	OnDestroy,
	OnInit,
	Output,
} from "@angular/core";
import { injectRef, QueryList } from "@electric/ng-utils";
import {
	animationFrameScheduler,
	merge,
	shareReplay,
	startWith,
	Subject,
	switchMap,
	takeUntil,
	throttleTime,
} from "rxjs";
import { ViewRectProvider } from "../glyph/editor";

import { RenderElement, RENDER_ELEMENT } from "./render.types";

@Component({
	selector: "canvas[g-canvas]",
	template: `<ng-content />`,
	changeDetection: ChangeDetectionStrategy.Default,
	standalone: false,
})
export class CanvasRenderer implements OnInit, AfterContentInit, OnDestroy {
	@Output() update = new EventEmitter<void>();

	@ContentChildren(RENDER_ELEMENT)
	private _elements!: QueryList<RenderElement>;

	private get _canvas() { return this._ref.nativeElement; }
	private _context!: CanvasRenderingContext2D;

	private _onDestroy$ = new Subject<void>();
	private _ref = injectRef<HTMLCanvasElement>();
	private _rect = inject(ViewRectProvider);

	ngOnInit(): void {
		const { offsetWidth: width, offsetHeight: height } = this._canvas;
		this._canvas.width = width * devicePixelRatio;
		this._canvas.height = height * devicePixelRatio;

		this._context = this._canvas.getContext("2d")!;
		if (!this._context)
			throw new Error("Failed to create canvas rendering context");

		this._rect.contentRect$.subscribe(({ width, height }) => {
			this._canvas.width = width * devicePixelRatio;
			this._canvas.height = height * devicePixelRatio;

			this.render();
		});
	}

	ngAfterContentInit(): void {
		const elements$ = this._elements.changes.pipe(
			startWith(this._elements),
			shareReplay({ bufferSize: 1, refCount: true }),
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
		const ctx = this._context;
		ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

		if (this._elements)
			for (let element of this._elements)
				element.onDraw(ctx);

		this.update.emit();
	}
}
