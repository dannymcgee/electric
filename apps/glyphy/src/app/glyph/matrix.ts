import { Const } from "@electric/utils";

const DEG2RAD = Math.PI / 180;

export class Matrix {
	static Identity: Const<Matrix> = new Matrix();

	constructor (
		public m11 = 1, public m12 = 0, public m13 = 0,
		public m21 = 0, public m22 = 1, public m23 = 0,
		public m31 = 0, public m32 = 0, public m33 = 1,
	) {}

	static scale(factor: number): Matrix;
	static scale(x: number, y: number): Matrix;

	static scale(...args: number[]): Matrix {
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
			default:
				throw new Error(`Matrix.scale expected 1 or 2 args, but received ${args.length}`);
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

		while (matrices.length) {
			const a = result.clone();
			const b = matrices.pop()!;

			result.m11 = (a.m11*b.m11 + a.m12*b.m21 + a.m13*b.m31);
			result.m12 = (a.m11*b.m12 + a.m12*b.m22 + a.m13*b.m32);
			result.m13 = (a.m11*b.m13 + a.m12*b.m23 + a.m13*b.m33);

			result.m21 = (a.m21*b.m11 + a.m22*b.m21 + a.m23*b.m31);
			result.m22 = (a.m21*b.m12 + a.m22*b.m22 + a.m23*b.m32);
			result.m23 = (a.m21*b.m13 + a.m22*b.m23 + a.m23*b.m33);

			result.m31 = (a.m31*b.m11 + a.m32*b.m21 + a.m33*b.m31);
			result.m32 = (a.m31*b.m12 + a.m32*b.m22 + a.m33*b.m32);
			result.m33 = (a.m31*b.m13 + a.m32*b.m23 + a.m33*b.m33);
		}

		return result;
	}

	clone(): Matrix {
		const result = new Matrix();

		result.m11 = this.m11;
		result.m12 = this.m12;
		result.m13 = this.m13;

		result.m21 = this.m21;
		result.m22 = this.m22;
		result.m23 = this.m23;

		result.m31 = this.m31;
		result.m32 = this.m32;
		result.m33 = this.m33;

		return result;
	}

	toString(): string {
		const {
			m11, m12, m13,
			m21, m22, m23,
			m31, m32, m33,
		} = this;

		return `Matrix(${m11} ${m12} ${m13}, ${m21} ${m22} ${m23}, ${m31} ${m32} ${m33})`;
	}
}
