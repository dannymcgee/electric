import { Const } from "@electric/utils";

import { nearlyEq } from "./util";
import { Vec, Vector } from "./vector.types";

export class Vec3 extends Vector implements Vec<3> {
	static readonly zero: Const<Vec3> = new Vec3(0, 0, 0);
	static readonly unit: Const<Vec3> = new Vec3(1, 1, 1);

	get x() { return this[0] }
	set x(value) { this[0] = value }

	get y() { return this[1] }
	set y(value) { this[1] = value }

	get z() { return this[2] }
	set z(value) { this[2] = value }

	declare readonly length: 3;

	constructor (x: number, y: number, z: number) {
		super(3);
		this[0] = x;
		this[1] = y;
		this[2] = z;
	}

	clone(): Vec3 {
		return new Vec3(this.x, this.y, this.z);
	}

	append(rhs: Const<Vec3>): void {
		this.x += rhs.x;
		this.y += rhs.y;
		this.z += rhs.z;
	}

	subtract(rhs: Const<Vec3>): void {
		this.x -= rhs.x;
		this.y -= rhs.y;
		this.z -= rhs.z;
	}

	normalize(): void {
		const len2 = vec3.len2(this);
		if (nearlyEq(len2, 1) || nearlyEq(len2, 0))
			return;

		const invLen = 1 / Math.sqrt(len2);
		this.x *= invLen;
		this.y *= invLen;
		this.z *= invLen;
	}
}

export function vec3(x: number, y: number, z: number) {
	return new Vec3(x, y, z);
}

export namespace vec3 {
	export function add(lhs: Const<Vec3>, rhs: Const<Vec3>): Vec3 {
		return vec3(
			lhs.x + rhs.x,
			lhs.y + rhs.y,
			lhs.z + rhs.z,
		);
	}

	export function sub(lhs: Const<Vec3>, rhs: Const<Vec3>): Vec3 {
		return vec3(
			lhs.x - rhs.x,
			lhs.y - rhs.y,
			lhs.x - rhs.z,
		);
	}

	export function neg(v: Const<Vec3>): Vec3 {
		const [x, y, z] = v;
		return vec3(-x, -y, -z);
	}

	export function mul(v: Const<Vec3>, s: number): Vec3 {
		return vec3(
			v.x * s,
			v.y * s,
			v.z * s,
		);
	}

	export function div(v: Const<Vec3>, s: number): Vec3 {
		const scale = 1 / s;
		return vec3(
			v.x * scale,
			v.y * scale,
			v.z * scale,
		);
	}

	export function dot(lhs: Const<Vec3>, rhs: Const<Vec3>): number {
		return lhs.x * rhs.x + lhs.y * rhs.y + lhs.z * rhs.z;
	}

	export function dist(lhs: Const<Vec3>, rhs: Const<Vec3>): number {
		const dx = lhs.x - rhs.x;
		const dy = lhs.y - rhs.y;
		const dz = lhs.z - rhs.z;
		return Math.sqrt(dx*dx + dy*dy + dz*dz);
	}

	export function len2(v: Const<Vec3>): number {
		const [x, y, z] = v;
		return x*x + y*y + z*z;
	}

	export function len(v: Const<Vec3>): number {
		const [x, y, z] = v;
		return Math.sqrt(x*x + y*y + z*z);
	}

	export function normal(v: Const<Vec3>): Vec3 {
		const result = v.clone();
		result.normalize();
		return result;
	}
}
