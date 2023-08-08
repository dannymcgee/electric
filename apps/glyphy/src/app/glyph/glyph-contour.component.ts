import {
	Component,
	ElementRef,
	EventEmitter,
	Input,
	OnDestroy,
	Output,
	TrackByFunction,
} from "@angular/core";
import { Const, match } from "@electric/utils";
import {
	animationFrameScheduler,
	fromEvent,
	map,
	merge,
	Subject,
	takeUntil,
	throttleTime,
} from "rxjs";

import { Matrix, Vec2, vec2 } from "../math";
import { Contour, Point } from "./path";

type PointKey
	= "coords"
	| "handle_in"
	| "handle_out";

type HandleKey = Exclude<PointKey, "coords">;

export interface UpdatePoint {
	index: number;
	point: Point;
}

@Component({
	selector: "g[g-glyph-contour]",
	templateUrl: "./glyph-contour.component.svg",
	styleUrls: ["./glyph-contour.component.scss"],
})
export class GlyphContourComponent implements OnDestroy {
	@Input("g-glyph-contour") c!: Const<Contour>;

	@Input() scaleFactor = 1;
	@Input() clientToGlyphCoords = Matrix.Identity;

	@Output() update = new EventEmitter<UpdatePoint>();

	trackByIndex: TrackByFunction<Point> = idx => idx;

	private _onDestroy$ = new Subject<void>();

	private get _svg() {
		return this._svgRef.nativeElement.ownerSVGElement!;
	}

	constructor (
		private _svgRef: ElementRef<SVGElement>,
	) {}

	ngOnDestroy(): void {
		this._onDestroy$.next();
		this._onDestroy$.complete();
	}

	onPointerDown(idx: number, key: PointKey, event: PointerEvent): void {
		if (event.button !== 0)
			return;

		fromEvent<PointerEvent>(this._svg, "pointermove")
			.pipe(
				throttleTime(0, animationFrameScheduler),
				map(event => [event, vec2(event.clientX, event.clientY)] as const),
				takeUntil(merge(
					fromEvent(this._svg, "pointerleave"),
					fromEvent(document, "pointerup"),
					this._onDestroy$,
				)),
			)
			.subscribe(([event, clientCoords]) => {
				if (!this.clientToGlyphCoords) return;

				const coords = this.clientToGlyphCoords.transformPoint(clientCoords);

				return match (key, {
					"coords": () => this.updateOnCurve(idx, event, coords),
					"handle_in": () => this.updateOffCurve(idx, event, coords, "handle_in"),
					"handle_out": () => this.updateOffCurve(idx, event, coords, "handle_out"),
				});
			});
	}

	/** @param coords The new glyph-space coordinates */
	private updateOnCurve(idx: number, event: PointerEvent, coords: Vec2): void {
		const p = this.c.points[idx];
		const updated = p.clone();
		const oldCoords = p.coords;
		const delta = vec2.sub(coords, oldCoords);

		if (p.smooth) {
			if (!p.handle_in || !p.handle_out) {
				// FIXME: I picked the wrong level of abstraction for this component. >_<
				//        I need to know the direction to the next or previous point
				//        to know how to keep the three points collinear.
				console.error("Can't move that point. For... reasons.");

				return;
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

				return this.update.emit({
					index: idx,
					point: updated,
				});
			}
		}

		updated.coords = coords;

		updated.handle_in = p.handle_in
			? vec2.add(p.handle_in, delta)
			: undefined;

		updated.handle_out = p.handle_out
			? vec2.add(p.handle_out, delta)
			: undefined;

		this.update.emit({
			index: this.c.points.indexOf(p),
			point: updated,
		});
	}

	/** @param coords The new glyph-space coordinates */
	private updateOffCurve(idx: number, event: PointerEvent, coords: Vec2, key: HandleKey): void {
		const p = this.c.points[idx];
		const updated = p.clone();
		const oldCoords = p[key]!;

		if (!p.smooth) {
			updated[key] = coords;

			return this.update.emit({
				index: idx,
				point: updated,
			});
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

			return this.update.emit({
				index: idx,
				point: updated,
			});
		}

		// TODO: Configurable keybindings
		const otherLength = event.altKey
			? vec2.dist(coords, p.coords)
			: vec2.dist(other, p.coords);

		const direction = vec2.sub(p.coords, coords).normalize();
		const otherCoords = vec2.add(p.coords, vec2.mul(direction, otherLength));

		updated[key] = coords;
		updated[otherKey] = otherCoords;

		this.update.emit({
			index: idx,
			point: updated,
		});
	}
}
