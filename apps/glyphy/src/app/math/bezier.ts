import { Const, Opt, assert } from "@electric/utils";

import { Vec2, vec2 } from "./vec2";

export class Bezier {
	constructor (
		public p0: Vec2,
		public p1: Vec2,
		public p2: Vec2,
		public p3: Vec2,
	) {}

	/**
	 * @returns null if `t` is not in the range [0, 1]
	 */
	sample(t: number): Opt<Vec2> {
		if (t < 0 || t > 1) return null;

		return vec2.add(
			vec2.add(
				vec2.mul(this.p0, Math.pow(1-t, 3)),
				vec2.mul(this.p1, 3 * Math.pow(1-t, 2) * t),
			),
			vec2.add(
				vec2.mul(this.p2, 3 * (1-t) * (t*t)),
				vec2.mul(this.p3, Math.pow(t, 3)),
			),
		);
	}

	/**
	 * @throws if `t` is not in the range [0, 1]
	 */
	sampleChecked(t: number): Vec2 {
		assert(t >= 0 && t <= 1);
		return this.sample(t)!;
	}

	/**
	 * @returns the points at the local x/y extrema of this curve
	 */
	extrema(): Vec2[] {
		const points: Vec2[] = [this.p0, this.p3];

		for (let xy of ["x", "y"] as const) {
			const i = this.p1[xy] - this.p0[xy];
			const j = this.p2[xy] - this.p1[xy];
			const k = this.p3[xy] - this.p2[xy];

			const a = (3*i - 6*j + 3*k);
			const b = (6*j - 6*i);
			const c = 3*i;

			const radicand = b*b - 4*a*c;
			if (radicand < 0) continue;

			const t1 = (-b + Math.sqrt(radicand)) / (2 * a);
			const t2 = (-b - Math.sqrt(radicand)) / (2 * a);

			if (t1 >= 0 && t1 <= 1)
				points.push(this.sampleChecked(t1));

			if (t2 >= 0 && t2 <= 1)
				points.push(this.sampleChecked(t2));
		}

		return points;
	}

	/** Project a given point onto the curve */
	project(point: Const<Vec2>): BezierPoint {
		const { coords, t } = this.findNearest(point);
		return { coords, t };
	}

	private findNearest(
		target: Const<Vec2>,
		result: SearchResult = {
			dist2: Infinity,
			coords: vec2(Infinity, Infinity),
			t: -1,
		},
		lower = 0, upper = 1,
		iter = 0,
	): SearchResult {
		const iterations = 8;
		const subdivs = 8;

		const step = (upper - lower) / subdivs;

		for (let t = lower; t <= upper; t += step) {
			const p = this.sampleChecked(t);
			const dist2 = vec2.dist2(p, target);

			if (dist2 < result.dist2) {
				result.dist2 = dist2;
				result.coords = p;
				result.t = t;
			}
		}

		if (iter < iterations) {
			const lower = Math.max(0, result.t - step * 2);
			const upper = Math.min(1, result.t + step * 2);

			return this.findNearest(target, result, lower, upper, iter + 1);
		}

		return result;
	}
}

export interface BezierPoint {
	coords: Const<Vec2>;
	t: number;
}

interface SearchResult extends BezierPoint {
	dist2: number;
}
