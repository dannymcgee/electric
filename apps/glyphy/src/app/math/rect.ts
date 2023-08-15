import { Const, Fn, match } from "@electric/utils";

import { Matrix } from "./matrix";
import { nearlyEq } from "./util";

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
}
