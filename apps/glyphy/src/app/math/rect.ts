import { Fn, match } from "@electric/utils";
import { nearlyEq } from "./util";

export interface Rect {
	x: number;
	y: number;
	width: number;
	height: number;
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

	static nearlyEq(a: Rect, b: Rect, tolerance?: number): boolean;
	static nearlyEq(tolerance?: number): (a: Rect, b: Rect) => boolean;

	static nearlyEq(...args: any[]) {
		return match (args.length, {
			0: () => (a: Rect, b: Rect) => this._nearlyEq(a, b, 1e-5),
			1: () => {
				const [tolerance] = args;
				return (a: Rect, b: Rect) => this._nearlyEq(a, b, tolerance);
			},
			_: () => {
				let [a, b, tolerance] = args;
				tolerance ??= 1e-5;
				return this._nearlyEq(a, b, tolerance);
			}
		}) as boolean | Fn<[Rect, Rect], boolean>
	}

	private static _nearlyEq(a: Rect, b: Rect, tolerance: number): boolean {
		return nearlyEq(a.x, b.x, tolerance)
			&& nearlyEq(a.y, b.y, tolerance)
			&& nearlyEq(a.width, b.width, tolerance)
			&& nearlyEq(a.height, b.height, tolerance);
	}
}
