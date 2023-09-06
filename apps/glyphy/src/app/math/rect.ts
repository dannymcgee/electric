import { Const, Fn, match } from "@electric/utils";

import { Matrix } from "./matrix";
import { nearlyEq } from "./util";
import { Vec2 } from "./vec2";

export interface IRect {
	x: number;
	y: number;
	width: number;
	height: number;
	readonly top: number;
	readonly right: number;
	readonly bottom: number;
	readonly left: number;
}

export class Rect {
	get top() { return this.y }
	get right() { return this.x + this.width }
	get bottom() { return this.y + this.height }
	get left() { return this.x }

	constructor (
		public x: number,
		public y: number,
		public width: number,
		public height: number,
	) {}

	static containing(...points: Const<Vec2>[]): Rect {
		let xMin = Infinity;
		let xMax = -Infinity;
		let yMin = Infinity;
		let yMax = -Infinity;

		for (let p of points) {
			xMin = Math.min(xMin, p.x);
			yMin = Math.min(yMin, p.y);

			xMax = Math.max(xMax, p.x);
			yMax = Math.max(yMax, p.y);
		}

		return new Rect(xMin, yMin, xMax-xMin, yMax-yMin);
	}

	static nearlyEq(a: IRect, b: IRect, tolerance?: number): boolean;
	static nearlyEq(tolerance?: number): (a: IRect, b: IRect) => boolean;

	static nearlyEq(...args: any[]) {
		return match (args.length, {
			0: () => (a: IRect, b: IRect) => this._nearlyEq(a, b, 1e-5),
			1: () => {
				const [tolerance] = args;
				return (a: IRect, b: IRect) => this._nearlyEq(a, b, tolerance);
			},
			_: () => {
				let [a, b, tolerance] = args;
				tolerance ??= 1e-5;
				return this._nearlyEq(a, b, tolerance);
			}
		}) as boolean | Fn<[IRect, IRect], boolean>
	}

	private static _nearlyEq(a: IRect, b: IRect, tolerance: number): boolean {
		return nearlyEq(a.x, b.x, tolerance)
			&& nearlyEq(a.y, b.y, tolerance)
			&& nearlyEq(a.width, b.width, tolerance)
			&& nearlyEq(a.height, b.height, tolerance);
	}

	transform(m: Const<Matrix>): Rect {
		const result = new Rect(this.x, this.y, this.width, this.height);
		result.transform_inPlace(m);

		return result;
	}

	transform_inPlace(m: Const<Matrix>): void {
		const p1 = m.transformPoint(this.left, this.top);
		const p2 = m.transformPoint(this.right, this.top);
		const p3 = m.transformPoint(this.right, this.bottom);
		const p4 = m.transformPoint(this.left, this.bottom);

		const xMin = Math.min(p1.x, p2.x, p3.x, p4.x);
		const yMin = Math.min(p1.y, p2.y, p3.y, p4.y);

		const xMax = Math.max(p1.x, p2.x, p3.x, p4.x);
		const yMax = Math.max(p1.y, p2.y, p3.y, p4.y);

		this.x = xMin;
		this.y = yMin;
		this.width = xMax - xMin;
		this.height = yMax - yMin;
	}

	inflate(amount: number): Rect {
		const result = new Rect(this.x, this.y, this.width, this.height);
		result.inflate_inPlace(amount);

		return result;
	}

	inflate_inPlace(amount: number): void {
		this.x -= amount;
		this.y -= amount;
		this.width += (amount * 2);
		this.height += (amount * 2);
	}

	intersects(rect: Const<IRect>): boolean {
		return this.left <= rect.right
			&& this.right >= rect.left
			&& this.top <= rect.bottom
			&& this.bottom >= rect.top;
	}

	contains(x: number, y: number): boolean;
	contains(p: Const<Vec2>): boolean;

	contains(...args: [number, number] | [Const<Vec2>]): boolean {
		return match (args.length, {
			1: () => {
				const [{ x, y }] = args as [Const<Vec2>];
				return this._contains(x, y);
			},
			2: () => {
				const [x, y] = args as [number, number];
				return this._contains(x, y);
			}
		});
	}

	private _contains(x: number, y: number): boolean {
		return x >= this.left && x <= this.right
			&& y >= this.top && y <= this.bottom;
	}
}
