import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	HostBinding,
	HostListener,
	Input,
	OnChanges,
	OnDestroy,
	OnInit,
	SimpleChanges,
	TrackByFunction,
} from "@angular/core";
import { ThemeService } from "@electric/components";
import { ElxResizeObserver } from "@electric/ng-utils";
import { assert, Const, exists, Option } from "@electric/utils";
import {
	animationFrameScheduler,
	BehaviorSubject,
	combineLatest,
	distinctUntilChanged,
	filter,
	fromEvent,
	map,
	Observable,
	race,
	scan,
	shareReplay,
	Subject,
	takeUntil,
	throttleTime,
} from "rxjs";

import { FamilyService } from "../family";
import { Matrix, nearlyEq, vec2 } from "../math";
import { Rect } from "../render";
import { Glyph } from "./glyph";
import { Point } from "./path";

class EditorPoint extends Point {
	readonly contourIndex: number;
	readonly pointIndex: number;

	constructor (ci: number, pi: number, point: Const<Point>) {
		super(point.x, point.y, point.smooth, point.hidden);

		this.handle_in = point.handle_in;
		this.handle_out = point.handle_out;

		this.contourIndex = ci;
		this.pointIndex = pi;
	}
}

@Component({
	selector: "g-glyph-editor",
	templateUrl: "./glyph-editor2.component.html",
	styleUrls: ["./glyph-editor2.component.scss"],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GlyphEditor2Component implements OnInit, OnChanges, OnDestroy {
	// Configuration
	@Input() glyph!: Glyph;
	@Input() metricsThickness = 1;
	@Input() pathThickness = 1;
	@Input() handleThickness = 1;

	// User input / events
	@HostBinding("class.pan-mode")
	isPanMode = false;

	@HostBinding("class.panning")
	isPanning = false;

	private _panAndZoom$ = new BehaviorSubject<Matrix>(Matrix.Identity as Matrix);
	panAndZoom$ = this._panAndZoom$.pipe(shareReplay({ bufferSize: 1, refCount: true }));

	marquee: Option<Rect> = null;
	points: EditorPoint[] = [];

	// Transforms
	contentRect$?: Observable<DOMRect>;
	glyphToCanvas$?: Observable<Const<Matrix>>;
	canvasToGlyph$?: Observable<Const<Matrix>>;

	private _onDestroy$ = new Subject<void>();

	trackPoint: TrackByFunction<EditorPoint> = (_, p) => {
		return this.points.length << 8
			& p.contourIndex << 16
			& p.pointIndex << 24;
	}

	constructor (
		private _cdRef: ChangeDetectorRef,
		public _familyService: FamilyService,
		private _ref: ElementRef<HTMLElement>,
		private _resizeObserver: ElxResizeObserver,
		public theme: ThemeService,
	) {}

	ngOnInit(): void {
		const resize$ = this._resizeObserver
			.observe(this._ref)
			.pipe(takeUntil(this._onDestroy$));

		this.contentRect$ = resize$.pipe(
			map(entry => entry.contentRect),
			distinctUntilChanged((a, b) => (
				nearlyEq(a.x, b.x)
				&& nearlyEq(a.y, b.y)
				&& nearlyEq(a.width, b.width)
				&& nearlyEq(a.height, b.height)
			)),
			shareReplay({ bufferSize: 1, refCount: true }),
			takeUntil(this._onDestroy$),
		);

		this.glyphToCanvas$ = combineLatest([
			this._familyService.family$.pipe(filter(exists)),
			this.contentRect$,
			this.panAndZoom$,
		]).pipe(
			throttleTime(0, animationFrameScheduler, {
				leading: true,
				trailing: true,
			}),
			map(([family, rect, panAndZoom]) => {
				const { ascender, descender } = family;

				const glyphHeight = ascender - descender;
				const glyphWidth = this.glyph.advance!;

				return Matrix.concat(
					// Center the glyph on the canvas origin
					Matrix.translate(-glyphWidth/2, -glyphHeight/2),
					Matrix.translate(0, -descender),
					// Scale to match the canvas height
					Matrix.scale(rect.height / glyphHeight),
					// Flip vertical
					Matrix.scale(1, -1),
					// Zoom out slightly and center in the canvas
					Matrix.scale(0.8),
					Matrix.translate(rect.width/2, rect.height/2),
					// Apply user pan / zoom
					panAndZoom,
				);
			}),
			shareReplay({ bufferSize: 1, refCount: true }),
			takeUntil(this._onDestroy$),
		);

		this.canvasToGlyph$ = this.glyphToCanvas$.pipe(
			map(matrix => matrix.inverse()),
			shareReplay({ bufferSize: 1, refCount: true }),
			takeUntil(this._onDestroy$),
		);
	}

	ngOnChanges(changes: SimpleChanges): void {
		if ("glyph" in changes) {
			if (!this.glyph.outline) {
				this.points = [];
				return;
			}

			const { contours } = this.glyph.outline;

			this.points = contours.flatMap((contour, ci) =>
				contour.points
					.map((point, pi) => new EditorPoint(ci, pi, point))
					.filter(p => !p.hidden)
			);
		}
	}

	ngOnDestroy(): void {
		this._onDestroy$.next();
		this._onDestroy$.complete();
		this._resizeObserver.unobserve(this._ref);
		this._panAndZoom$.complete();
	}

	@HostListener("window:keydown", ["$event"])
	onKeyDown(event: KeyboardEvent): void {
		// TODO: Make hotkeys configurable
		if (event.key === " ")
			this.isPanMode = true;
	}

	@HostListener("window:keyup", ["$event"])
	onKeyUp(event: KeyboardEvent): void {
		if (event.key === " ")
			this.isPanMode = false;
	}

	@HostListener("pointerdown", ["$event"])
	onPointerDown(event: PointerEvent): void {
		// TODO: Make pan button configurable
		if (event.button === 1
			|| (event.button === 0 && this.isPanMode))
		{
			this.beginPan();
		}
		else if (event.button === 0) {
			this.beginMarqueeSelect(event);
		}
	}

	@HostListener("wheel", ["$event"])
	onWheel({ deltaY, offsetX, offsetY }: WheelEvent): void {
		const delta = deltaY / (175 * 7.5); // TODO: Adjustable sensitivity
		this.adjustZoom(delta, offsetX, offsetY);
	}

	private beginPan(): void {
		this.isPanning = true;

		fromEvent<PointerEvent>(this._ref.nativeElement, "pointermove")
			.pipe(
				scan((accum, event) => ({
					prev: accum.current,
					current: event,
				}), {
					prev: null as Option<PointerEvent>,
					current: null as Option<PointerEvent>,
				}),
				map(({ prev, current }) => {
					if (!current || !prev) return vec2(0, 0);
					return vec2(
						current.clientX - prev.clientX,
						current.clientY - prev.clientY,
					);
				}),
				takeUntil(race(
					fromEvent(this._ref.nativeElement, "pointerleave"),
					fromEvent(document, "pointerup"),
					this._onDestroy$,
				)),
			)
			.subscribe({
				next: ({ x: dx, y: dy }) => {
					const matrix = this._panAndZoom$.value;

					this._panAndZoom$.next(Matrix.concat(
						matrix,
						Matrix.translate(dx, dy),
					));
				},
				complete: () => {
					this.isPanning = false;
				},
			});
	}

	private adjustZoom(delta: number, originX: number, originY: number): void {
		const matrix = this._panAndZoom$.value;

		this._panAndZoom$.next(Matrix.concat(
			matrix,
			Matrix.translate(-originX, -originY),
			Matrix.scale(1 - delta),
			Matrix.translate(originX, originY),
		));
	}

	private beginMarqueeSelect(event: PointerEvent): void {
		const { offsetX: xInit, offsetY: yInit } = event;

		this.marquee = {
			x: xInit,
			y: yInit,
			width: 0,
			height: 0,
		};

		fromEvent<PointerEvent>(this._ref.nativeElement, "pointermove")
			.pipe(takeUntil(race(
				fromEvent(window, "pointerup"),
				fromEvent(this._ref.nativeElement, "pointerleave"),
				this._onDestroy$,
			)))
			.subscribe({
				next: event => {
					const left = Math.min(event.offsetX, xInit);
					const top = Math.min(event.offsetY, yInit);
					const width = Math.max(xInit, event.offsetX) - left;
					const height = Math.max(yInit, event.offsetY) - top;

					assert(this.marquee != null);

					this.marquee.x = left;
					this.marquee.y = top;
					this.marquee.width = width;
					this.marquee.height = height;

					this._cdRef.detectChanges();
				},
				complete: () => {
					const bounds = this.marquee!;
					this.marquee = null;

					this.marqueeSelect(bounds);

					this._cdRef.detectChanges();
				},
			});
	}

	private marqueeSelect(bounds: Rect): void {
		console.log("Bounds for selection:", bounds);
	}
}
