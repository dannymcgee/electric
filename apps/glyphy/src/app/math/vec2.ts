import { Const, Fn, match, Option } from "@electric/utils";

import * as util from "./util";

export class Vec2 {
	static readonly zero: Const<Vec2> = new Vec2(0, 0);
	static readonly unit: Const<Vec2> = new Vec2(1, 1);

	x: number;
	y: number;

	/** Vector magnitude */
	get length(): number { return vec2.len(this); }
	/** Squared vector magnitude (i.e. length^2) */
	get length2(): number { return vec2.len2(this); }

	constructor (x: number, y: number) {
		this.x = x;
		this.y = y;
	}

	clone(): Vec2 {
		return new Vec2(this.x, this.y);
	}

	append(rhs: Const<Vec2>): void {
		this.x += rhs.x;
		this.y += rhs.y;
	}

	subtract(rhs: Const<Vec2>): void {
		this.x -= rhs.x;
		this.y -= rhs.y;
	}

	/**
	 * Normalizes the vector in-place and returns the result. Use
	 * `vec2.normal(v)` if an immutable operation is required.
	 */
	normalize(): Vec2 {
		const len2 = vec2.len2(this);
		if (util.nearlyEq(len2, 1) || util.nearlyEq(len2, 0))
			return this;

		const invLen = 1 / Math.sqrt(len2);
		this.x *= invLen;
		this.y *= invLen;

		return this;
	}

	/**
	 * Computes the vector length and normalized direction in a single step and
	 * returns the result. Does not modify the vector.
	 */
	lengthAndNormal(): [number, Vec2] {
		const len = this.length;

		if (util.nearlyEq(len, 0))
			return [len, Vec2.zero];

		const invLen = 1 / len;
		const normal = vec2.mul(this, invLen);

		return [len, normal];
	}

	join(sep: string): string {
		return `${this.x}${sep}${this.y}`;
	}

	toString(): string {
		return `Vec2(${this.x}, ${this.y})`;
	}
}

export function vec2(x: number, y: number) {
	return new Vec2(x, y);
}

export namespace vec2 {
	export function add(lhs: Const<Vec2>, rhs: Const<Vec2>): Vec2 {
		return vec2(lhs.x+rhs.x, lhs.y+rhs.y);
	}

	export function sub(lhs: Const<Vec2>, rhs: Const<Vec2>): Vec2 {
		return vec2(lhs.x-rhs.x, lhs.y-rhs.y);
	}

	export function neg(v: Const<Vec2>): Vec2 {
		const { x, y } = v;
		return vec2(-x, -y);
	}

	export function mul(v: Const<Vec2>, s: number): Vec2 {
		return vec2(v.x*s, v.y*s);
	}

	export function div(v: Const<Vec2>, s: number): Vec2 {
		const scale = 1 / s;
		return vec2(v.x*scale, v.y*scale);
	}

	export function dot(lhs: Const<Vec2>, rhs: Const<Vec2>): number {
		return lhs.x*rhs.x + lhs.y*rhs.y;
	}

	/** Squared distance */
	export function dist2(lhs: Const<Vec2>, rhs: Const<Vec2>): number {
		const dx = lhs.x - rhs.x;
		const dy = lhs.y - rhs.y;
		return dx*dx + dy*dy;
	}

	export function dist(lhs: Const<Vec2>, rhs: Const<Vec2>): number {
		const dx = lhs.x - rhs.x;
		const dy = lhs.y - rhs.y;
		return Math.sqrt(dx*dx + dy*dy);
	}

	/** Squared vector length */
	export function len2(v: Const<Vec2>): number {
		const { x, y } = v;
		return x*x + y*y;
	}

	export function len(v: Const<Vec2>): number {
		const { x, y } = v;
		return Math.sqrt(x*x + y*y);
	}

	export function normal(v: Const<Vec2>): Vec2 {
		const result = v.clone();
		result.normalize();
		return result;
	}

	export function areCollinear(...points: Const<Vec2>[]): boolean {
		if (points.length < 3)
			return true;

		return points
			.reduce((accum, point) => {
				if (!accum.result)
					return accum;

				const { prev } = accum;
				if (!prev) {
					accum.prev = point;

					return accum;
				}

				const slope = (point.y - prev.y) / (point.x - prev.x);

				if (Number.isNaN(accum.slope) || slope === accum.slope) {
					accum.slope = slope;
					accum.prev = point;

					return accum;
				}


				if (util.nearlyEq(accum.slope, slope, 1e-5)) {
					accum.prev = point;

					return accum;
				}

				accum.result = false;

				return accum;
			}, {
				result: true,
				slope: Number.NaN,
				prev: null as Option<Const<Vec2>>,
			})
			.result;
	}

	const DEFAULT_TOLERANCE = 1e-5;

	export function nearlyEq(lhs: Const<Vec2>, rhs: Const<Vec2>, tolerance?: number): boolean;
	export function nearlyEq(tolerance?: number): Fn<[Const<Vec2>, Const<Vec2>], boolean>;

	export function nearlyEq(...args: any[]) {
		return match (args.length, {
			0: () => (a: Const<Vec2>, b: Const<Vec2>) => _nearlyEq(a, b, DEFAULT_TOLERANCE),
			1: () => {
				const [tolerance] = args;
				return (a: Const<Vec2>, b: Const<Vec2>) => _nearlyEq(a, b, tolerance);
			},
			_: () => {
				let [a, b, tolerance] = args;
				tolerance ??= DEFAULT_TOLERANCE;
				return _nearlyEq(a, b, tolerance);
			}
		}) as boolean | Fn<[Const<Vec2>, Const<Vec2>], boolean>;
	}

	function _nearlyEq(lhs: Const<Vec2>, rhs: Const<Vec2>, tolerance: number): boolean {
		return util.nearlyEq(lhs.x, rhs.x, tolerance)
			&& util.nearlyEq(lhs.y, rhs.y, tolerance);
	}
}
