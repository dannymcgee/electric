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
import { assert, Const, exists, match, Option } from "@electric/utils";
import {
	animationFrameScheduler,
	BehaviorSubject,
	combineLatest,
	distinctUntilChanged,
	filter,
	fromEvent,
	map,
	Observable,
	of,
	race,
	scan,
	shareReplay,
	Subject,
	takeUntil,
	tap,
	throttleTime,
	withLatestFrom,
} from "rxjs";

import { FamilyService } from "../family";
import { Matrix, nearlyEq, Vec2, vec2 } from "../math";
import { Rect } from "../render";
import { Glyph } from "./glyph";
import { Point } from "./path";

type PointKey
	= "coords"
	| "handle_in"
	| "handle_out";

type HandleKey = Exclude<PointKey, "coords">;

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

	activePoint?: EditorPoint;
	activeKey?: PointKey;

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
			this.updatePoints();

			if (changes["glyph"].firstChange && this.glyph)
				this.glyph.outline?.changes$
					.pipe(takeUntil(this._onDestroy$))
					.subscribe(() => this.updatePoints());
		}
	}

	ngOnDestroy(): void {
		this._onDestroy$.next();
		this._onDestroy$.complete();
		this._resizeObserver.unobserve(this._ref);
		this._panAndZoom$.complete();
	}

	onCurvePointStyle(point: EditorPoint) {
		const shape = point.smooth ? "circle" : "box";
		let radius = point.smooth ? 4 : 3.5;
		let strokeWidth = 1;

		// TODO: Create a theme color for this
		let fill = "#99C4FF80";
		if (point.pointIndex === 0)
			fill = this.theme.getHex("warning", 800, 0.5)!;
		else if (point.smooth)
			fill = this.theme.getHex("accent", 700, 0.5)!;

		let stroke = "#99C4FF";
		if (point.pointIndex === 0)
			stroke = this.theme.getHex("warning", 800)!;
		else if (point.smooth)
			stroke = this.theme.getHex("accent", 800)!;

		if (point === this.activePoint && this.activeKey === "coords") {
			radius = 5.5;
			strokeWidth = 2;
		}

		return { shape, radius, fill, stroke, strokeWidth } as const;
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
		else if (event.button === 0 && !this.activePoint) {
			this.beginMarqueeSelect(event);
		}
	}

	@HostListener("pointerenter")
	onPointerEnter(): void {
		this.beginHitTesting();
	}

	@HostListener("wheel", ["$event"])
	onWheel({ deltaY, offsetX, offsetY }: WheelEvent): void {
		const delta = deltaY / (175 * 7.5); // TODO: Adjustable sensitivity
		this.adjustZoom(delta, offsetX, offsetY);
	}

	private updatePoints(): void {
		if (!this.glyph.outline) {
			this.points = [];
			this._cdRef.detectChanges();
			return;
		}

		const { contours } = this.glyph.outline;

		this.points = contours.flatMap((contour, ci) =>
			contour.points
				.map((point, pi) => new EditorPoint(ci, pi, point))
				.filter(p => !p.hidden)
		);
		this._cdRef.detectChanges();
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

	private beginHitTesting(): void {
		fromEvent<PointerEvent>(this._ref.nativeElement, "pointermove")
			.pipe(
				throttleTime(0, animationFrameScheduler, {
					leading: true,
					trailing: true,
				}),
				withLatestFrom(combineLatest([
					this.canvasToGlyph$ ?? of(Matrix.Identity),
					this.glyphToCanvas$ ?? of(Matrix.Identity),
				])),
				map(([{ offsetX, offsetY }, [canvasToGlyph, glyphToCanvas]]) => {
					const glyphCoords = canvasToGlyph.transformPoint(vec2(offsetX, offsetY));
					const canvasCoords = vec2(offsetX, offsetY);
					return {
						glyphCoords,
						canvasCoords,
						glyphToCanvas,
					}
				}),
				// FIXME: This event flow is unorthodox and kind of spaghet
				tap(({ glyphCoords, canvasCoords, glyphToCanvas }) => {
					this.hitTest(glyphCoords, canvasCoords, glyphToCanvas);
				}),
				takeUntil(race(
					fromEvent(this._ref.nativeElement, "pointerleave").pipe(
						// FIXME: This event flow is unorthodox and kind of spaghet
						tap(() => {
							if (this.activePoint || this.activeKey) {
								this.activePoint = undefined;
								this.activeKey = undefined;
								this._cdRef.markForCheck();
							}
						}),
					),
					fromEvent(this._ref.nativeElement, "pointerdown").pipe(
						tap(() => this.beginEditing())
					),
					this._onDestroy$,
				)),
			)
			.subscribe();
	}

	private hitTest(
		glyphCoords: Const<Vec2>,
		canvasCoords: Const<Vec2>,
		glyphToCanvas: Const<Matrix>
	): void {
		// Find the nearest EditorPoint to the cursor
		const p = this.points.sort(ascendingByDistanceTo(glyphCoords))[0];

		// Find the nearest control in the point
		const closest = [
			p.coords,
			p.handle_in,
			p.handle_out,
		]
			.filter(exists)
			.sort((a, b) => vec2.dist2(a, glyphCoords) - vec2.dist2(b, glyphCoords))
			[0];

		// Check if it's within some small radius in screen-space
		const canvasClosest = glyphToCanvas.transformPoint(closest);

		if (vec2.dist(canvasClosest, canvasCoords) < 12) {
			let needsCheck = (
				!this.activePoint
				|| !this.activeKey
				|| this.activePoint !== p
			);
			this.activePoint = p;

			const hoveringControl
				= closest === p.coords    ? "coords"
				: closest === p.handle_in ? "handle_in"
				                          : "handle_out";

			needsCheck ||= this.activeKey !== hoveringControl;
			this.activeKey = hoveringControl;

			if (needsCheck)
				this._cdRef.markForCheck();
		}
		else if (this.activePoint || this.activeKey) {
			this.activePoint = undefined;
			this.activeKey = undefined;
			this._cdRef.markForCheck();
		}
	}

	private beginEditing(): void {
		fromEvent<PointerEvent>(this._ref.nativeElement, "pointermove")
			.pipe(
				throttleTime(0, animationFrameScheduler, {
					leading: true,
					trailing: true,
				}),
				withLatestFrom(this.canvasToGlyph$ ?? of(Matrix.Identity)),
				takeUntil(race(
					fromEvent(this._ref.nativeElement, "pointerleave"),
					fromEvent(document, "pointerup").pipe(tap(() => this.beginHitTesting())),
					this._onDestroy$,
				)),
			)
			.subscribe({
				next: ([event, canvasToGlyph]) => {
					if (!this.activePoint || !this.activeKey) {
						console.error("Uh oh");
						return;
					}
					const { offsetX, offsetY } = event;
					const coords = canvasToGlyph.transformPoint(vec2(offsetX, offsetY));

					match (this.activeKey, {
						"coords": () => this.updateOnCurve(event, coords),
						"handle_in": () => this.updateOffCurve(event, coords),
						"handle_out": () => this.updateOffCurve(event, coords),
					})
				},
				complete: () => {
					if (this.activePoint || this.activeKey) {
						this.activePoint = undefined;
						this.activeKey = undefined;
						this._cdRef.markForCheck();
					}
				}
			});
	}

	private updateOnCurve(event: PointerEvent, coords: Vec2): void {
		assert(this.glyph.outline != null);
		assert(this.activePoint != null);
		assert(this.activeKey != null);

		const p = this.activePoint;
		const ci = p.contourIndex;
		const pi = p.pointIndex;
		const c = this.glyph.outline.contours[ci];

		const updated = p.clone();
		const oldCoords = p.coords;
		const delta = vec2.sub(coords, oldCoords);

		if (p.smooth) {
			if (!p.handle_in || !p.handle_out) {
				const [handle, handleKey, refPoint] = !!p.handle_in
					? [p.handle_in, "handle_in", c.points[(pi + 1) % c.points.length]] as const
					: [p.handle_out!, "handle_out", c.points[pi - 1] ?? c.last] as const;

				const handleLen = vec2.dist(handle, oldCoords);
				const direction = vec2.sub(coords, refPoint.coords).normalize();

				updated[handleKey] = vec2.add(coords, vec2.mul(direction, handleLen));
				updated.coords = coords;

				return this.glyph.outline.editPoint(ci, pi, () => updated);
			}

			// TODO: Configurable keybindings
			if (event.altKey) {
				// Slide the on-curve point between the handles
				const direction = vec2.sub(p.handle_in, p.handle_out).normalize();
				const toHandle = vec2.sub(coords, p.handle_in);
				const projLength = vec2.dot(direction, toHandle);

				updated.coords = vec2.add(
					p.handle_in,
					vec2.mul(direction, projLength),
				);

				return this.glyph.outline.editPoint(ci, pi, () => updated);
			}
		}

		updated.coords = coords;

		updated.handle_in = p.handle_in
			? vec2.add(p.handle_in, delta)
			: undefined;

		updated.handle_out = p.handle_out
			? vec2.add(p.handle_out, delta)
			: undefined;

		this.glyph.outline.editPoint(ci, pi, () => updated);
	}

	private updateOffCurve(event: PointerEvent, coords: Vec2): void {
		assert(this.glyph.outline != null);
		assert(this.activePoint != null);
		assert(this.activeKey != null);

		const p = this.activePoint;
		const ci = p.contourIndex;
		const pi = p.pointIndex;
		const key = this.activeKey as HandleKey;
		const updated = p.clone();
		const oldCoords = p[key]!;

		if (!p.smooth) {
			updated[key] = coords;

			return this.glyph.outline.editPoint(ci, pi, () => updated);
		}

		const [other, otherKey] = match (key, {
			"handle_in": () => [p.handle_out, "handle_out"] as const,
			"handle_out": () => [p.handle_in, "handle_in"] as const,
		});

		if (!other) {
			const newLength = vec2.dist(coords, p.coords);
			const direction = vec2.sub(oldCoords, p.coords).normalize();
			let constrained = vec2.add(p.coords, vec2.mul(direction, newLength));

			if (vec2.dist(coords, constrained) > newLength) {
				// we're trying to pull the handle in the opposite direction, past
				// the on-curve point, which shouldn't be allowed.

				// TODO: In the long term, collapsing the handle into the point like
				// this should maybe erase the handle completely and turn the point
				// into a corner, but we're not set up to handle that yet, so
				// instead we'll clamp the newLength to a minimum of 1.
				constrained = vec2.add(p.coords, direction);
			}

			updated[key] = constrained;

			return this.glyph.outline.editPoint(ci, pi, () => updated);
		}

		// TODO: Configurable keybindings
		const otherLength = event.altKey
			? vec2.dist(coords, p.coords)
			: vec2.dist(other, p.coords);

		const direction = vec2.sub(p.coords, coords).normalize();
		const otherCoords = vec2.add(p.coords, vec2.mul(direction, otherLength));

		updated[key] = coords;
		updated[otherKey] = otherCoords;

		this.glyph.outline.editPoint(ci, pi, () => updated);
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

function closestInPoint(point: EditorPoint, ref: Vec2) {
	return [
		point.coords,
		point.handle_in,
		point.handle_out,
	].reduce(
		(accum, p) => {
			if (!p) return accum;
			return Math.min(accum, vec2.dist2(p, ref));
		},
		Number.POSITIVE_INFINITY,
	);
}

function ascendingByDistanceTo(coords: Vec2) {
	return (a: EditorPoint, b: EditorPoint) =>
		closestInPoint(a, coords) - closestInPoint(b, coords);
}
