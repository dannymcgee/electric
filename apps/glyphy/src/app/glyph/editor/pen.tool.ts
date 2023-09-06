import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	Input,
	OnChanges,
	OnInit,
	SimpleChanges,
} from "@angular/core";
import { ThemeService } from "@electric/components";
import { Const, Option, replayUntil } from "@electric/utils";
import {
	BehaviorSubject,
	combineLatest,
	map,
	Observable,
	of,
	race,
	Subject,
	switchMap,
	takeUntil,
	withLatestFrom,
} from "rxjs";

import { FontMetrics } from "../../family";
import { Bezier, IRect, Matrix, Rect, Vec2, vec2 } from "../../math";
import { GroupRenderer, RenderElement, RENDER_ELEMENT } from "../../render";
import { Glyph } from "../glyph";
import { Path } from "../path";
import { InputProvider } from "./input.provider";
import { EditorBezier, EditorPoint } from "./types";
import { Hash2D } from "./rulers.renderer";
import { findNearestPoint } from "./glyph-editor.utils";

// TODO: There's a lot of copypasta between this and ContourEditorTool.
//       Would be nice to have a better abstraction for varying behavior while
//       sharing large parts of the view.

@Component({
	selector: "g-pen-tool",
	templateUrl: "./pen.tool.html",
	providers: [{
		provide: RENDER_ELEMENT,
		useExisting: PenTool,
	}],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PenTool
	extends GroupRenderer
	implements RenderElement, OnChanges, OnInit
{
	@Input() glyph!: Const<Glyph>;
	@Input() outline?: Const<Path>;
	@Input() metrics!: Const<FontMetrics>;

	@Input() viewRect!: Const<IRect>;
	@Input() glyphToCanvas!: Const<Matrix>;
	@Input() canvasToGlyph!: Const<Matrix>;

	private _points$ = new BehaviorSubject<EditorPoint[]>([]);
	get points() { return this._points$.value; }

	private _newPoint$ = new BehaviorSubject<Option<Vec2>>(null);
	newPoint$ = this._newPoint$.asObservable();

	private _beziers$ = new BehaviorSubject<EditorBezier[]>([]);
	readonly beziers$ = this._beziers$.asObservable();

	// debugPoints$: Observable<Vec2[]> = of([]);

	boundingBoxes$: Observable<Rect[]> = of([]);
	private _activeBoundingBoxes$ = new BehaviorSubject<Rect[]>([]);
	activeBoundingBoxes$ = this._activeBoundingBoxes$.asObservable();

	private _outline$ = new BehaviorSubject<Option<Const<Path>>>(null);
	private _newOutlineEvent$ = new Subject<void>();

	private _hashes$ = new BehaviorSubject<Hash2D[]>([]);
	get hashes() { return this._hashes$.value; }

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

	ngOnInit(): void {
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

		this._outline$
			.pipe(
				map(outline => {
					if (!outline) return [];
					return outline.contours.reduce((accum, c, ci) => {
						for (let i=0, j=1; j < c.points.length; ++i, ++j) {
							const ep1 = c.points[i];
							const ep2 = c.points[j];

							const p0 = ep1.coords;
							const p3 = ep2.coords;
							const p1 = ep1.handle_out ?? p0;
							const p2 = ep2.handle_in ?? p3;

							const bez = new Bezier(p0, p1, p2, p3);
							accum.push(new EditorBezier(bez, ci, [i, j]));
						}
						return accum;
					}, [] as EditorBezier[]);
				}),
				replayUntil(this.onDestroy$),
			)
			.subscribe(beziers => this._beziers$.next(beziers));

		this.boundingBoxes$ = this._beziers$.pipe(
			map(beziers => beziers.map(bezier => {
				const bounds = Rect.containing(...bezier.extrema());
				bounds.inflate_inPlace(6);

				return bounds;
			})),
			replayUntil(this.onDestroy$),
		);

		// this.debugPoints$ = this.beziers$.pipe(
		// 	map(curves => curves.flatMap(curve => curve.extrema())),
		// 	replayUntil(this.onDestroy$),
		// );

		// Pointer coords in client space
		const clientPtr$ = this._input.ptrLocation$.pipe(replayUntil(this.onDestroy$));

		// Pointer coords in glyph space
		const glyphPtr$ = clientPtr$.pipe(
			map(ptr => this.canvasToGlyph.transformPoint(ptr)),
			replayUntil(this.onDestroy$),
		);

		// Hit Test
		const hitResult$ = this._input.ptrUp(0).pipe(
			switchMap(() => combineLatest([glyphPtr$, clientPtr$]).pipe(
				withLatestFrom(points$, this.beziers$, this.boundingBoxes$),
				map(([[gPtr, cPtr], points, beziers, bbs]) =>
					this.hitTest(gPtr, cPtr, points, beziers, bbs)
				),
				takeUntil(race(
					this._input.ptrDown(0),
					this.onDestroy$,
				)),
			)),
			takeUntil(this.onDestroy$),
		);

		// Render
		combineLatest([points$, hitResult$])
			.pipe(takeUntil(this.onDestroy$))
			.subscribe(([points, hitResult]) => {
				for (let i = 0; i < points.length; ++i)
					points[i].active = false;

				switch (hitResult.kind) {
					case HitResultKind.None: {
						this._newPoint$.next(hitResult.value);
						this._points$.next(points);
						this._hashes$.next([{
							value: hitResult.value,
							lineColor: this.theme.getHex("primary", 600)!,
							textColor: this.theme.getHex("primary", 600)!,
						}]);

						break;
					}
					case HitResultKind.ExistingPoint: {
						hitResult.value.active = true;
						hitResult.value.activeKey = "coords";

						const idx = points.findIndex(p => p.id === hitResult.value.id);
						points[idx] = hitResult.value;

						this._newPoint$.next(null);
						this._points$.next(points.slice());
						this._hashes$.next([{
							value: hitResult.value.coords,
							lineColor: this.theme.getHex("primary", 600)!,
							textColor: this.theme.getHex("primary", 600)!,
						}]);

						break;
					}
					case HitResultKind.NewPointOnCurve: {
						this._newPoint$.next(hitResult.value.coords);
						this._points$.next(points);
						this._hashes$.next([{
							value: hitResult.value.coords,
							lineColor: this.theme.getHex("primary", 600)!,
							textColor: this.theme.getHex("primary", 600)!,
						}]);

						break;
					}
				}

				this._cdRef.detectChanges();
			});
	}

	hitTest(
		gPtr: Const<Vec2>,
		cPtr: Const<Vec2>,
		points: readonly Const<EditorPoint>[],
		beziers: Bezier[],
		bbs: Rect[],
	): HitResult {
		const nearestPoint = findNearestPoint(gPtr, points);
		if (nearestPoint?.key === "coords") {
			const { point } = nearestPoint;
			const cCoords = this.glyphToCanvas.transformPoint(point.coords);

			if (vec2.dist2(cCoords, cPtr) <= 12*12)
				return {
					kind: HitResultKind.ExistingPoint,
					value: point,
				};
		}

		const activeBbs: Rect[] = [];
		const candidateBeziers: Bezier[] = [];

		for (let i = 0; i < beziers.length; ++i) {
			const bbox = bbs[i];
			if (bbox.contains(gPtr)) {
				activeBbs.push(bbox);
				candidateBeziers.push(beziers[i]);
			}
		}

		const projected = candidateBeziers
			.map(bez => [bez, bez.project(gPtr)] as const)
			.sort(([, a], [, b]) => vec2.dist2(a.coords, gPtr) - vec2.dist2(b.coords, gPtr));

		if (projected.length) {
			const [bezier, { t, coords }] = projected[0];
			const cCoords = this.glyphToCanvas.transformPoint(coords);

			if (vec2.dist2(cCoords, cPtr) < 12*12)
				return {
					kind: HitResultKind.NewPointOnCurve,
					value: { bezier, t, coords },
				};
		}

		return {
			kind: HitResultKind.None,
			value: gPtr,
		};
	}

	// override onDraw(ctx: CanvasRenderingContext2D): void {
	// 	super.onDraw(ctx);

	// 	let color = chroma("#FF0000");
	// 	const curves = this._beziers$.value;
	// 	const hueStep = 360 / curves.length;
	// 	const xform = this.glyphToCanvas.mul(devicePixelRatio).toDomMatrix();

	// 	for (let bezier of curves) {
	// 		const { p0, p1, p2, p3 } = bezier;
	// 		console.log(
	// 			`%cBezier (${p0.x},${p0.y}) (${p1.x},${p1.y}) (${p2.x},${p2.y}) (${p3.x},${p3.y})`,
	// 			`color: ${color.hex()}`,
	// 		);

	// 		// Draw curve segment
	// 		ctx.beginPath();
	// 		ctx.setTransform(xform);

	// 		ctx.moveTo(p0.x, p0.y);
	// 		ctx.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);

	// 		ctx.resetTransform();

	// 		ctx.lineWidth = 2 * devicePixelRatio;
	// 		ctx.strokeStyle = color.hex();
	// 		ctx.stroke();

	// 		// draw points at extrema
	// 		const extrema = bezier.extrema();
	// 		console.log(
	// 			`%cExtrema ${extrema.map(p => `(${p.x},${p.y})`).join(" ")}`,
	// 			`color: ${color.hex()}`,
	// 		);
	// 		for (let p of extrema) {
	// 			ctx.beginPath();
	// 			p = this.glyphToCanvas.mul(devicePixelRatio).transformPoint(p);
	// 			ctx.arc(p.x, p.y, 4*devicePixelRatio, 0, 2*Math.PI);

	// 			ctx.fillStyle = color.hex();
	// 			ctx.fill();
	// 		}

	// 		// draw bbox outline
	// 		const bbox = Rect.containing(...extrema);
	// 		console.log(
	// 			`%cBBox (${bbox.x},${bbox.y}) (${bbox.width},${bbox.height})`,
	// 			`color: ${color.hex()}`,
	// 		);
	// 		ctx.beginPath();
	// 		ctx.setTransform(xform);
	// 		ctx.rect(bbox.x, bbox.y, bbox.width, bbox.height);
	// 		ctx.resetTransform();

	// 		ctx.strokeStyle = color.hex();
	// 		ctx.lineWidth = 0.5 * devicePixelRatio;
	// 		ctx.stroke();

	// 		color = color.set("hsl.h", color.get("hsl.h") + hueStep);
	// 	}
	// }
}

enum HitResultKind {
	None = 0,
	ExistingPoint,
	NewPointOnCurve,
}

type HitResult = {
	kind: HitResultKind.None;
	value: Vec2;
} | {
	kind: HitResultKind.ExistingPoint;
	value: EditorPoint;
} | {
	kind: HitResultKind.NewPointOnCurve;
	value: {
		bezier: Bezier;
		t: number;
		coords: Vec2;
	};
}
