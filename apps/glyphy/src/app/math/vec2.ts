import { Const } from "@electric/utils";

import { nearlyEq } from "./util";
import { Vec, Vector } from "./vector.types";

export class Vec2 extends Vector implements Vec<2> {
	static readonly zero: Const<Vec2> = new Vec2(0, 0);
	static readonly unit: Const<Vec2> = new Vec2(1, 1);

	get x() { return this[0]; }
	set x(value) { this[0] = value; }

	get y() { return this[1]; }
	set y(value) { this[1] = value; }

	declare readonly length: 2;

	constructor (x: number, y: number) {
		super(2);
		this[0] = x;
		this[1] = y;
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

	normalize(): void {
		const len2 = vec2.len2(this);
		if (nearlyEq(len2, 1) || nearlyEq(len2, 0))
			return;

		const invLen = 1 / Math.sqrt(len2);
		this.x *= invLen;
		this.y *= invLen;
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
		const [x, y] = v;
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

	export function dist(lhs: Const<Vec2>, rhs: Const<Vec2>): number {
		const dx = lhs.x - rhs.x;
		const dy = lhs.y - rhs.y;
		return Math.sqrt(dx*dx + dy*dy);
	}

	export function len2(v: Const<Vec2>): number {
		const [x, y] = v;
		return x*x + y*y;
	}

	export function len(v: Const<Vec2>): number {
		const [x, y] = v;
		return Math.sqrt(x*x + y*y);
	}

	export function normal(v: Const<Vec2>): Vec2 {
		const result = v.clone();
		result.normalize();
		return result;
	}
}
