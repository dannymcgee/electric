import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	Input,
	OnChanges,
	OnDestroy,
	OnInit,
	SimpleChanges,
} from "@angular/core";
import { ThemeService } from "@electric/components";
import {
	animationFrames,
	assert,
	Const,
	match,
	Option,
	replayUntil,
} from "@electric/utils";
import {
	BehaviorSubject,
	combineLatest,
	distinctUntilChanged,
	map,
	race,
	Subject,
	switchMap,
	takeUntil,
	withLatestFrom,
} from "rxjs";

import { FontMetrics } from "../../family";
import { Matrix, Rect, Vec2, vec2 } from "../../math";
import { GroupRenderer, RenderElement, RENDER_ELEMENT } from "../../render";
import { Glyph } from "../glyph";
import { Path } from "../path";
import { InputProvider } from "./input.provider";
import { EditorPoint, HandleKey } from "./types";

@Component({
	selector: "g-contour-editor",
	templateUrl: "./contour-editor.tool.html",
	providers: [{
		provide: RENDER_ELEMENT,
		useExisting: ContourEditorTool,
	}],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContourEditorTool
	extends GroupRenderer
	implements RenderElement, OnChanges, OnInit, OnDestroy
{
	@Input() glyph!: Const<Glyph>;
	@Input() outline?: Const<Path>;
	@Input() metrics!: Const<FontMetrics>;

	@Input() viewRect!: Const<Rect>;
	@Input() glyphToCanvas!: Const<Matrix>;
	@Input() canvasToGlyph!: Const<Matrix>;

	/**
	 * Note: Normally we would use observables with the `async` pipe directly in
	 * the template, but in this case it would cause the incoming outline path to
	 * render one frame ahead of the editable control points. Instead, we use
	 * BehaviorSubjects with `value` getters and `ChangeDetectorRef` for fine-
	 * grained control of exactly when our child components should receive new
	 * versions of their inputs.
	 */
	private _points$ = new BehaviorSubject<EditorPoint[]>([]);
	get points() { return this._points$.value; }

	private _activePoint$ = new BehaviorSubject<Option<EditorPoint>>(null);
	readonly activePoint$ = this._activePoint$.asObservable();
	get activePoint() { return this._activePoint$.value; }

	private _outline$ = new BehaviorSubject<Option<Const<Path>>>(null);
	private _newOutlineEvent$ = new Subject<void>();

	constructor (
		private _cdRef: ChangeDetectorRef,
		private _input: InputProvider,
		public theme: ThemeService,
	) {
		super();
	}

	ngOnChanges(changes: SimpleChanges): void {
		if ("outline" in changes) {
			this._newOutlineEvent$.next();

			const outline = this.outline;
			this._outline$.next(outline);

			outline?.changes$
				.pipe(takeUntil(race(
					this._newOutlineEvent$,
					this.onDestroy$,
				)))
				.subscribe(() => {
					this._outline$.next(outline);
				});
		}
	}

	/**
	 * TODO: This is pretty hacky and could cause headaches down the road.
	 *
	 * Here's an overview of the event flow we're setting up in `ngOnInit`:
	 *
	 *  1) [Input]: Receive a new version of the outline via `outline.changes$`
	 *  2) [Transformation]: Map the path representation to a flat array of
	 *     `EditorPoint`s, which is easier for this component to work with
	 *  3) [Hit Test]: if the pointer is up and close enough to a control point...
	 *     a) set that point's `active` and `activeKey` properties (in-place)
	 *     b) emit `_activePoint$.next`
	 *  4) [Edit]: if there's an active point and the pointer is down...
	 *     a) clone it and update the clone's inner coordinates
	 *     b) emit `_activePoint$.next` _again_ with the clone
	 *     c) call `outline.editPoint` (via `this.editPoint`) to sync our changes
	 *        back to the glyph
	 *
	 * [4c] will trigger a repeat of the cycle, with the outline emitting
	 * `changes$` once it's processed the `editPoint` call.
	 *
	 * We want to render immediately after [4c], but we want the view to reflect
	 * the updates made in [4a], so to finish up:
	 *  - Subscribe on a combination of `points$` and `activePoint$`
	 *  - Splice the active point back into the points array if it exists
	 *  - Call `detectChanges` to update the view
	 */
	ngOnInit(): void {
		// Transformation
		const points$ = this._outline$.pipe(
			map(outline => {
				if (!outline) return [];
				return outline.contours
					.flatMap((contour, ci) => contour.points
						.map((point, pi) => new EditorPoint(ci, pi, point))
						.filter(p => !p.hidden)
					)
			}),
			replayUntil(this.onDestroy$),
		);

		// Pointer coords in client space
		const clientPtr$ = animationFrames().pipe(
			withLatestFrom(this._input.ptrLocation$),
			distinctUntilChanged(([, a], [, b]) => vec2.nearlyEq(a, b, 0.5)),
			map(([, ptr]) => ptr),
			replayUntil(this.onDestroy$),
		);

		// Pointer coords in glyph space
		const glyphPtr$ = clientPtr$.pipe(
			map(ptr => this.canvasToGlyph.transformPoint(ptr)),
			replayUntil(this.onDestroy$),
		);

		// Hit Test
		this._input.ptrUp(0)
			.pipe(
				switchMap(() => combineLatest([glyphPtr$, clientPtr$]).pipe(
					withLatestFrom(points$),
					map(([[gPtr, cPtr], points]) => this.hitTest(gPtr, cPtr, points)),
					distinctUntilChanged((a, b) => a?.id === b?.id),
					takeUntil(race(
						this._input.ptrDown(0),
						this.onDestroy$,
					)),
				)),
				takeUntil(this.onDestroy$),
			)
			.subscribe(activePoint => {
				this._activePoint$.next(activePoint);
			});

		// Edit
		this._input.ptrDown(0)
			.pipe(
				switchMap(() => combineLatest([glyphPtr$, this._input.keysDown$]).pipe(
					withLatestFrom(this.activePoint$),
					takeUntil(race(
						this._input.ptrUp(0),
						this.onDestroy$,
					)),
				)),
				takeUntil(this.onDestroy$),
			)
			.subscribe(([[gPtr, keys], activePoint]) => {
				if (activePoint)
					this.editPoint(gPtr, keys, activePoint);
			});

		// Render
		combineLatest([points$, this.activePoint$])
			.pipe(takeUntil(this.onDestroy$))
			.subscribe(([points, activePoint]) => {
				if (activePoint) {
					const idx = points.findIndex(p => p.id === activePoint.id);
					points.splice(idx, 1, activePoint);
				}

				this._points$.next(points);
				this._cdRef.detectChanges();
			});
	}

	override ngOnDestroy(): void {
		super.ngOnDestroy();

		this._outline$.complete();
		this._newOutlineEvent$.complete();
	}

	/**
	 * Determine whether the active pointer is close enough to any control point
	 * to be considered "hitting" or "hovering" it, and updates the `active` and
	 * `activeKey` properties of the control points as appropriate.
	 *
	 * @returns the nearest control point within the hit radius, or `null`.
	 *
	 * @param gPtr The pointer coordinates, in glyph coordinate space
	 * @param cPtr The pointer coordinates, in client coordinate space
	 * @param points The control points of the outline
	 */
	hitTest(gPtr: Const<Vec2>, cPtr: Const<Vec2>, points: EditorPoint[]): Option<EditorPoint> {
		if (!points.length) return null;

		for (let i = 0; i < points.length; ++i)
			points[i].active = false;

		const sorted = points.slice().sort(ascendingByDistanceTo(gPtr));
		const nearestPoint = sorted[0];

		const d2Coords = vec2.dist2(nearestPoint.coords, gPtr);
		const d2Handle_in = nearestPoint.handle_in
			? vec2.dist2(nearestPoint.handle_in, gPtr)
			: Infinity;
		const d2Handle_out = nearestPoint.handle_out
			? vec2.dist2(nearestPoint.handle_out, gPtr)
			: Infinity;

		const d2Nearest = Math.min(d2Coords, d2Handle_in, d2Handle_out);
		const key = match (d2Nearest, {
			[d2Coords]: () => "coords" as const,
			[d2Handle_in]: () => "handle_in" as const,
			[d2Handle_out]: () => "handle_out" as const,
		});

		const cNearestCoords = this.glyphToCanvas.transformPoint(nearestPoint[key]!);
		if (vec2.dist2(cNearestCoords, cPtr) <= 12*12) {
			nearestPoint.active = true;
			nearestPoint.activeKey = key;

			return nearestPoint;
		}

		return null;
	}

	/**
	 * Update the active point.
	 *
	 * @param gPtr The pointer coordinates, in glyph coordinate space
	 * @param keys Keyboard keys currently being pressed
	 * @param point The point to update
	 */
	editPoint(gPtr: Const<Vec2>, keys: ReadonlySet<string>, point: Const<EditorPoint>): void {
		const updated = match (point.activeKey!, {
			"coords": () => this.editOnCurvePoint(gPtr, keys, point),
			"handle_in": () => this.editOffCurvePoint(gPtr, keys, point),
			"handle_out": () => this.editOffCurvePoint(gPtr, keys, point),
		});

		this._activePoint$.next(updated);
		this.outline!.editPoint(point.contourIndex, point.pointIndex, () => updated);
	}

	/**
	 * Move the on-curve point (represnted by `EditorPoint.coords`).
	 *
	 * @returns a copy of the point with the changes applied.
	 *
	 * @param gPtr The pointer coordinates, in glyph coordinate space
	 * @param keys Keyboard keys currently being pressed
	 * @param p The point to update
	 */
	editOnCurvePoint(
		gPtr: Const<Vec2>,
		keys: ReadonlySet<string>,
		p: Const<EditorPoint>
	): EditorPoint {
		assert(this.outline != null);

		const ci = p.contourIndex;
		const pi = p.pointIndex;
		const c = this.outline.contours[ci];

		const updated = p.clone();
		const delta = vec2.sub(gPtr, p.coords);

		if (p.smooth) {
			if (!p.handle_in || !p.handle_out) {
				// Tangent point - keep the handle collinear with this and the
				// nearest on-curve point
				const [handle, handleKey, refPoint] = !!p.handle_in
					? [p.handle_in, "handle_in", c.points[(pi + 1) % c.points.length]] as const
					: [p.handle_out!, "handle_out", c.points[pi - 1] ?? c.last] as const;

				const handleLen = vec2.dist(handle, p.coords);
				const direction = vec2.sub(p.coords, refPoint.coords).normalize();

				updated[handleKey] = vec2.add(gPtr, vec2.mul(direction, handleLen));
				updated.coords = gPtr;

				return updated;
			}

			// TODO: Configurable keybindings
			if (keys.has("Alt")) {
				// Slide the on-curve point between the handles
				const direction = vec2.sub(p.handle_in, p.handle_out).normalize();
				const toHandle = vec2.sub(gPtr, p.handle_in);
				const projLength = vec2.dot(direction, toHandle);

				updated.coords = vec2.add(
					p.handle_in,
					vec2.mul(direction, projLength),
				);

				return updated;
			}
		}

		// Move the on-curve point and its handles as a unit
		updated.coords = gPtr;

		updated.handle_in = p.handle_in
			? vec2.add(p.handle_in, delta)
			: undefined;

		updated.handle_out = p.handle_out
			? vec2.add(p.handle_out, delta)
			: undefined;

		return updated;
	}

	/**
	 * Move an off-curve point (represented by `EditorPoint.handle_[in|out]`).
	 *
	 * @returns a copy of the point with the changes applied.
	 *
	 * @param gPtr The pointer coordinates, in glyph coordinate space
	 * @param keys Keyboard keys currently being pressed
	 * @param p The point to update
	 */
	editOffCurvePoint(
		gPtr: Const<Vec2>,
		keys: ReadonlySet<string>,
		p: Const<EditorPoint>,
	): EditorPoint {
		assert(this.outline != null);

		const key = p.activeKey as HandleKey;
		const updated = p.clone();
		const pActiveCoords = p[key]!;

		if (!p.smooth) {
			// Just move the handle
			updated[key] = gPtr;

			return updated;
		}

		const [other, otherKey] = match (key, {
			"handle_in": () => [p.handle_out, "handle_out"] as const,
			"handle_out": () => [p.handle_in, "handle_in"] as const,
		});

		if (!other) {
			// Tangent point - constrain the handle to length adjustments only
			const newLength = vec2.dist(gPtr, p.coords);
			const direction = vec2.sub(pActiveCoords, p.coords).normalize();
			let constrained = vec2.add(p.coords, vec2.mul(direction, newLength));

			// FIXME: This isn't a perfect test - we really want to know if the
			// angle of coords -> p.coords <- nearest on-curve point is <= 90°
			if (vec2.dist(gPtr, constrained) > newLength) {
				// we're trying to pull the handle in the opposite direction, past
				// the on-curve point, which shouldn't be allowed.

				// TODO: In the long term, collapsing the handle into the point like
				// this should maybe erase the handle completely and turn the point
				// into a corner, but we're not set up to handle that yet, so
				// instead we'll clamp the newLength to a minimum of 1.
				constrained = vec2.add(p.coords, direction);
			}

			updated[key] = constrained;

			return updated;
		}

		// TODO: Configurable keybindings
		// Match the length of the other handle to this one if Alt key is down
		const otherLength = keys.has("Alt")
			? vec2.dist(gPtr, p.coords)
			: vec2.dist(other, p.coords);

		// Keep the other handle collinear with this one
		const direction = vec2.sub(p.coords, gPtr).normalize();
		const otherCoords = vec2.add(p.coords, vec2.mul(direction, otherLength));

		updated[key] = gPtr;
		updated[otherKey] = otherCoords;

		return updated;
	}

	// TODO: Marquee-selection and batch transformation of points.
	//       Depends on updating `Path` to accept batched edits.

	/*
	// Note: this was copy/pasted from GlyphEditorComponent
	private beginMarqueeSelect(event: PointerEvent): void {
		const { offsetX: xInit, offsetY: yInit } = event;

		this.marquee = new Rect(xInit, yInit, 0, 0);

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
		// console.log("Bounds for selection:", bounds);
	}
	*/
}

function ascendingByDistanceTo(coords: Const<Vec2>) {
	return (a: EditorPoint, b: EditorPoint) =>
		closestInPoint(a, coords) - closestInPoint(b, coords);
}

function closestInPoint(point: EditorPoint, ref: Const<Vec2>) {
	return [
		point.coords,
		point.handle_in,
		point.handle_out,
	].reduce(
		(accum, p) => {
			if (!p) return accum;
			return Math.min(accum, vec2.dist2(p, ref));
		},
		Infinity,
	);
}