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
import { KeybindRegistry } from "@electric/ng-utils";
import {
	assert,
	Const,
	delta,
	match,
	Option,
	replayUntil,
} from "@electric/utils";
import {
	BehaviorSubject,
	combineLatest,
	distinctUntilChanged,
	filter,
	map,
	race,
	Subject,
	switchMap,
	take,
	takeUntil,
	withLatestFrom,
} from "rxjs";

import { FontMetrics } from "../../family";
import { IRect, Matrix, nearlyEq, Vec2, vec2 } from "../../math";
import { GroupRenderer, RenderElement, RENDER_ELEMENT } from "../../render";
import { Glyph } from "../glyph";
import { Path } from "../path";
import { findNearestPoint } from "./glyph-editor.utils";
import { InputProvider } from "./input.provider";
import { Hash2D } from "./rulers.renderer";
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

	@Input() viewRect!: Const<IRect>;
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

	private _hashes$ = new BehaviorSubject<Hash2D[]>([]);
	get hashes() { return this._hashes$.value; }

	constructor (
		private _cdRef: ChangeDetectorRef,
		private _input: InputProvider,
		private _keyBinds: KeybindRegistry,
		public theme: ThemeService,
	) {
		super();
	}

	ngOnChanges(changes: SimpleChanges): void {
		this.changes$.emit();

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
		const clientPtr$ = this._input.ptrLocation$.pipe(replayUntil(this.onDestroy$));

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
				if (!activePoint)
					this._hashes$.next([]);

				this._activePoint$.next(activePoint);
			});

		// Edit start
		this._input.ptrDown(0)
			.pipe(
				withLatestFrom(this.activePoint$),
				filter(([, activePoint]) => activePoint != null),
				takeUntil(this.onDestroy$),
			)
			.subscribe(() => {
				this.outline!.beginTransaction();

				race(this._input.ptrUp(0), this.onDestroy$)
					.pipe(take(1))
					.subscribe(() => {
						this.outline?.endTransaction();
					});
			});

		this._keyBinds.register("Ctrl+Z", this.undo);
		this._keyBinds.register("Ctrl+Shift+Z", this.redo);

		// Edit
		this._input.ptrDown(0)
			.pipe(
				switchMap(() => combineLatest([
					glyphPtr$.pipe(delta({ diff: vec2.sub, zero: Vec2.zero })),
					this._input.keysDown$
				]).pipe(
					withLatestFrom(this.activePoint$),
					takeUntil(race(
						this._input.ptrUp(0),
						this.onDestroy$,
					)),
				)),
				takeUntil(this.onDestroy$),
			)
			.subscribe(([[delta, keys], activePoint]) => {
				if (activePoint)
					this.editPoint(delta, keys, activePoint);
			});

		// Render
		combineLatest([points$, this.activePoint$])
			.pipe(takeUntil(this.onDestroy$))
			.subscribe(([points, activePoint]) => {
				if (activePoint) {
					this._hashes$.next([{
						value: activePoint[activePoint.activeKey!]!,
						lineColor: this.theme.getHex("primary", 600)!,
						textColor: this.theme.getHex("primary", 600)!,
					}]);

					const idx = points.findIndex(p => p.id === activePoint.id);
					points[idx] = activePoint;
				}

				this._points$.next(points.slice());
				this._cdRef.detectChanges();
			});
	}

	override ngOnDestroy(): void {
		super.ngOnDestroy();

		this._points$.complete();
		this._activePoint$.complete();
		this._outline$.complete();
		this._newOutlineEvent$.complete();
		this._hashes$.complete();

		this._keyBinds.unregister("Ctrl+Z", this.undo);
		this._keyBinds.unregister("Ctrl+Shift+Z", this.redo);
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

		const result = findNearestPoint(gPtr, points);
		if (!result) return null;

		const { key, point } = result;
		const cCoords = this.glyphToCanvas.transformPoint(point[key]!);
		if (vec2.dist2(cCoords, cPtr) <= 12*12) {
			point.active = true;
			point.activeKey = key;

			return point;
		}

		return null;
	}

	/**
	 * Update the active point.
	 *
	 * @param delta The amount of change to apply, in glyph coordinate space
	 * @param keys Keyboard keys currently being pressed
	 * @param point The point to update
	 */
	editPoint(delta: Const<Vec2>, keys: ReadonlySet<string>, point: Const<EditorPoint>): void {
		const updated = match (point.activeKey!, {
			"coords": () => this.editOnCurvePoint(delta, keys, point),
			"handle_in": () => this.editOffCurvePoint(delta, keys, point),
			"handle_out": () => this.editOffCurvePoint(delta, keys, point),
		});

		this._activePoint$.next(updated);
		this.outline!.editPoint(point.contourIndex, point.pointIndex, () => updated);
	}

	/**
	 * Move the on-curve point (represnted by `EditorPoint.coords`).
	 *
	 * @returns a copy of the point with the changes applied.
	 *
	 * @param delta The amount of change to apply, in glyph coordinate space
	 * @param keys Keyboard keys currently being pressed
	 * @param p The point to update
	 */
	editOnCurvePoint(
		delta: Const<Vec2>,
		keys: ReadonlySet<string>,
		p: Const<EditorPoint>
	): EditorPoint {
		assert(this.outline != null);

		const ci = p.contourIndex;
		const pi = p.pointIndex;
		const c = this.outline.contours[ci];
		const targetCoords = vec2.add(p.coords, delta);

		const updated = p.clone();

		if (p.smooth) {
			if (!p.handle_in || !p.handle_out) {
				// Tangent point - keep the handle collinear with this and the
				// nearest on-curve point
				const [handle, handleKey, refPoint] = !!p.handle_in
					? [p.handle_in, "handle_in", c.points[(pi + 1) % c.points.length]] as const
					: [p.handle_out!, "handle_out", c.points[pi - 1] ?? c.last] as const;

				const handleLen = vec2.dist(handle, p.coords);
				const direction = vec2.sub(p.coords, refPoint.coords).normalize();

				updated[handleKey] = vec2.add(targetCoords, vec2.mul(direction, handleLen));
				updated.coords = targetCoords;

				return updated;
			}

			// TODO: Configurable keybindings
			if (keys.has("Alt")) {
				// Slide the on-curve point between the handles
				const direction = vec2.sub(p.handle_in, p.handle_out).normalize();
				const toHandle = vec2.sub(targetCoords, p.handle_in);
				const projLength = vec2.dot(direction, toHandle);

				let constrained = vec2.add(p.handle_in, vec2.mul(direction, projLength));

				// Don't allow the on-curve point to slide _past_ either of the handles
				const distHandleIn = vec2.dist(constrained, p.handle_in);
				const distHandleOut = vec2.dist(constrained, p.handle_out);
				const distHandles = vec2.dist(p.handle_in, p.handle_out);

				if (distHandleIn+distHandleOut > distHandles
					&& !nearlyEq(distHandleIn+distHandleOut, distHandles, 1e-5))
				{
					const [handle, other] = match (Math.min(distHandleIn, distHandleOut), {
						[distHandleIn]: () => [p.handle_in!, p.handle_out!],
						[distHandleOut]: () => [p.handle_out!, p.handle_in!],
					});
					const direction = vec2.sub(other, handle).normalize();
					constrained = vec2.add(handle, direction);
				}

				updated.coords = constrained;

				return updated;
			}
		}

		// Move the on-curve point and its handles as a unit
		updated.coords = targetCoords;

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
	 * @param delta The amount of change to apply, in glyph coordinate space
	 * @param keys Keyboard keys currently being pressed
	 * @param p The point to update
	 */
	editOffCurvePoint(
		delta: Const<Vec2>,
		keys: ReadonlySet<string>,
		p: Const<EditorPoint>,
	): EditorPoint {
		assert(this.outline != null);

		const key = p.activeKey as HandleKey;
		const updated = p.clone();
		const pActiveCoords = p[key]!;
		const targetCoords = vec2.add(pActiveCoords, delta);

		if (!p.smooth) {
			// Just move the handle
			updated[key] = targetCoords;

			return updated;
		}

		const [other, otherKey] = match (key, {
			"handle_in": () => [p.handle_out, "handle_out"] as const,
			"handle_out": () => [p.handle_in, "handle_in"] as const,
		});

		if (!other) {
			// Tangent point - constrain the handle to length adjustments only
			const newLength = vec2.dist(targetCoords, p.coords);
			const direction = vec2.sub(pActiveCoords, p.coords).normalize();
			let constrained = vec2.add(p.coords, vec2.mul(direction, newLength));

			// FIXME: This isn't a perfect test - we really want to know if the
			// angle of coords -> p.coords <- nearest on-curve point is <= 90°
			if (vec2.dist(targetCoords, constrained) > newLength) {
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
			? vec2.dist(targetCoords, p.coords)
			: vec2.dist(other, p.coords);

		// Keep the other handle collinear with this one
		const direction = vec2.sub(p.coords, targetCoords).normalize();
		const otherCoords = vec2.add(p.coords, vec2.mul(direction, otherLength));

		updated[key] = targetCoords;
		updated[otherKey] = otherCoords;

		return updated;
	}

	undo = (): void => {
		this.outline?.undo();
	}

	redo = (): void => {
		this.outline?.redo();
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
