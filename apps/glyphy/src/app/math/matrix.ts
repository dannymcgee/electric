import { Const, match } from "@electric/utils";
import { DEG2RAD, nearlyEq } from "./util";

import { vec2, Vec2 } from "./vec2";
import { vec3, Vec3 } from "./vec3";

export class Matrix {
	static Identity: Const<Matrix> = new Matrix();

	constructor (
		public m11 = 1, public m12 = 0, public m13 = 0,
		public m21 = 0, public m22 = 1, public m23 = 0,
		public m31 = 0, public m32 = 0, public m33 = 1,
	) {}

	static from(dom: DOMMatrix): Matrix {
		return new Matrix(
			dom.a, dom.b, 0,
			dom.c, dom.d, 0,
			dom.e, dom.f, 1,
		);
	}

	toDomMatrix(): DOMMatrix {
		return new DOMMatrix([
			this.m11, this.m12,
			this.m21, this.m22,
			this.m31, this.m32,
		]);
	}

	static scale(factor: number): Matrix;
	static scale(x: number, y: number): Matrix;

	static scale(...args: [number] | [number, number]): Matrix {
		switch (args.length) {
			case 1: {
				const [s] = args;
				return new Matrix(
					s, 0, 0,
					0, s, 0,
					0, 0, 1,
				);
			}
			case 2: {
				const [x, y] = args;
				return new Matrix(
					x, 0, 0,
					0, y, 0,
					0, 0, 1,
				);
			}
		}
	}

	static translate(dx: number, dy: number): Matrix {
		return new Matrix(
			1, 0, 0,
			0, 1, 0,
			dx, dy, 1,
		);
	}

	static rotate(deg: number): Matrix {
		const rad = deg * DEG2RAD;
		const sin = Math.sin(rad);
		const cos = Math.cos(rad);

		return new Matrix(
			cos, sin, 0,
			-sin, cos, 0,
			0, 0, 1,
		);
	}

	static concat(...matrices: Const<Matrix>[]) {
		let result = new Matrix();

		for (let rhs of matrices) {
			const lhs_row_1 = result.row(1);
			const lhs_row_2 = result.row(2);
			const lhs_row_3 = result.row(3);

			const rhs_col_1 = rhs.col(1);
			const rhs_col_2 = rhs.col(2);
			const rhs_col_3 = rhs.col(3);

			result.m11 = vec3.dot(lhs_row_1, rhs_col_1);
			result.m12 = vec3.dot(lhs_row_1, rhs_col_2);
			result.m13 = vec3.dot(lhs_row_1, rhs_col_3);

			result.m21 = vec3.dot(lhs_row_2, rhs_col_1);
			result.m22 = vec3.dot(lhs_row_2, rhs_col_2);
			result.m23 = vec3.dot(lhs_row_2, rhs_col_3);

			result.m31 = vec3.dot(lhs_row_3, rhs_col_1);
			result.m32 = vec3.dot(lhs_row_3, rhs_col_2);
			result.m33 = vec3.dot(lhs_row_3, rhs_col_3);
		}

		return result;
	}

	transformPoint(x: number, y: number): Vec2;
	transformPoint(p: Const<Vec2>): Vec2;

	transformPoint(...args: [number, number] | [Const<Vec2>]): Vec2 {
		switch (args.length) {
			case 1: {
				const [p] = args as [Const<Vec2>];
				const row = vec3(p.x, p.y, 1);
				return vec2(
					vec3.dot(row, this.col(1)),
					vec3.dot(row, this.col(2)),
				);
			}
			case 2: {
				const [x, y] = args as [number, number];
				const row = vec3(x, y, 1);
				return vec2(
					vec3.dot(row, this.col(1)),
					vec3.dot(row, this.col(2)),
				);
			}
		}
	}

	transformPoint_inPlace(p: Vec2): void {
		const row = vec3(p.x, p.y, 1);
		p.x = vec3.dot(row, this.col(1));
		p.y = vec3.dot(row, this.col(2));
	}

	transformVector(x: number, y: number): Vec2;
	transformVector(p: Const<Vec2>): Vec2;

	transformVector(...args: [number, number] | [Const<Vec2>]): Vec2 {
		switch (args.length) {
			case 1: {
				const [v] = args as [Const<Vec2>];
				const row = vec3(v.x, v.y, 0);
				return vec2(
					vec3.dot(row, this.col(1)),
					vec3.dot(row, this.col(2)),
				);
			}
			case 2: {
				const [x, y] = args as [number, number];
				const row = vec3(x, y, 0);
				return vec2(
					vec3.dot(row, this.col(1)),
					vec3.dot(row, this.col(2)),
				);
			}
		}
	}

	transformVector_inPlace(v: Vec2): void {
		const row = vec3(v.x, v.y, 0);
		v.x = vec3.dot(row, this.col(1));
		v.y = vec3.dot(row, this.col(2));
	}

	clone(): Matrix {
		return new Matrix(
			this.m11, this.m12, this.m13,
			this.m21, this.m22, this.m23,
			this.m31, this.m32, this.m33,
		);
	}

	toString(): string {
		const {
			m11, m12, m13,
			m21, m22, m23,
			m31, m32, m33,
		} = this;

		return `Matrix(${m11} ${m12} ${m13}, ${m21} ${m22} ${m23}, ${m31} ${m32} ${m33})`;
	}

	toCssString(): string {
		return `matrix(${this.m11},${this.m12},${this.m21},${this.m22},${this.m31},${this.m32})`;
	}

	row(n: 1|2|3): Vec3 {
		return match (n, {
			1: () => vec3(this.m11, this.m12, this.m13),
			2: () => vec3(this.m21, this.m22, this.m23),
			3: () => vec3(this.m31, this.m32, this.m33),
		});
	}

	col(n: 1|2|3): Vec3 {
		return match (n, {
			1: () => vec3(this.m11, this.m21, this.m31),
			2: () => vec3(this.m12, this.m22, this.m32),
			3: () => vec3(this.m13, this.m23, this.m33),
		});
	}

	mul(s: number): Matrix {
		return new Matrix(
			this.m11*s, this.m12*s, this.m13*s,
			this.m21*s, this.m22*s, this.m23*s,
			this.m31*s, this.m32*s, this.m33*s,
		);
	}

	inverse(): Matrix {
		const det = this.determinant();
		if (nearlyEq(det, 0)) {
			console.warn(`Matrix is not invertible: ${this}`);
			return this;
		}
		return this.adjoint().mul(1 / det);
	}

	private determinant(): number {
		return vec3.dot(
			vec3.cross(this.row(1), this.row(2)),
			this.row(3),
		);
	}

	private adjoint(): Matrix {
		const m = new Matrix();

		// every m[r][c] = cofactor(c,r)
		m.m11 = this.cofactor(1,1);
		m.m12 = this.cofactor(2,1);
		m.m13 = this.cofactor(3,1);

		m.m21 = this.cofactor(1,2);
		m.m22 = this.cofactor(2,2);
		m.m23 = this.cofactor(3,2);

		m.m31 = this.cofactor(1,3);
		m.m32 = this.cofactor(2,3);
		m.m33 = this.cofactor(3,3);

		return m;
	}

	private cofactor(r: 1|2|3, c: 1|2|3): number {
		const factor = ((r + c) % 2) ? -1 : 1;
		return this.minor(r, c) * factor;
	}

	private minor(r: 1|2|3, c: 1|2|3): number {
		const [ m11, m12,  m21, m22 ] =
			match (r, {
				1: () => match (c, {
					1: () => [ this.m22, this.m23,  this.m32, this.m33 ] as const,
					2: () => [ this.m21, this.m23,  this.m31, this.m33 ] as const,
					3: () => [ this.m21, this.m22,  this.m31, this.m32 ] as const,
				}),
				2: () => match (c, {
					1: () => [ this.m12, this.m13,  this.m32, this.m33 ] as const,
					2: () => [ this.m11, this.m13,  this.m31, this.m33 ] as const,
					3: () => [ this.m11, this.m12,  this.m31, this.m32 ] as const,
				}),
				3: () => match (c, {
					1: () => [ this.m12, this.m13,  this.m22, this.m23 ] as const,
					2: () => [ this.m11, this.m13,  this.m21, this.m23 ] as const,
					3: () => [ this.m11, this.m12,  this.m21, this.m22 ] as const,
				}),
			});

		return m11*m22 - m12*m21;
	}
}
