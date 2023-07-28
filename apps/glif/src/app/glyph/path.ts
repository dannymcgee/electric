import { Const } from "@electric/utils";
import { Matrix } from "./matrix";

export interface IPath {
	/**
	 * Move to the specified point ⟨x, y⟩. Equivalent to context.moveTo and SVG’s
	 * “moveto” command.
	 *
	 * @param x x-Coordinate of point to move to
	 * @param y y-Coordinate of point to move to
	 */
	moveTo(x: number, y: number): void;

	/**
	 * Ends the current subpath and causes an automatic straight line to be drawn
	 * from the current point to the initial point of the current subpath.
	 * Equivalent to context.closePath and SVG’s “closepath” command.
	 */
	closePath(): void;

	/**
	 * Draws a straight line from the current point to the specified point ⟨x, y⟩.
	 * Equivalent to context.lineTo and SVG’s “lineto” command.
	 *
	 * @param x x-Coordinate of point to draw the line to
	 * @param y y-Coordinate of point to draw the line to
	 */
	lineTo(x: number, y: number): void;

	// TODO
	// /**
	//  * Draws a quadratic Bézier segment from the current point to the specified point ⟨x, y⟩, with the specified control point ⟨cpx, cpy⟩.
	//  * Equivalent to context.quadraticCurveTo and SVG’s quadratic Bézier curve commands.
	//  *
	//  * @param cpx x-Coordinate of the control point for the quadratic Bézier curve
	//  * @param cpy y-Coordinate of the control point for the quadratic Bézier curve
	//  * @param x x-Coordinate of point to draw the curve to
	//  * @param y y-Coordinate of point to draw the curve to
	//  */
	// quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): void;

	/**
	 * Draws a cubic Bézier segment from the current point to the specified point
	 * ⟨x, y⟩, with the specified control points ⟨cpx1, cpy1⟩ and ⟨cpx2, cpy2⟩.
	 * Equivalent to context.bezierCurveTo and SVG’s cubic Bézier curve commands.
	 *
	 * @param cpx1 x-Coordinate of the first control point for the Bézier curve
	 * @param cpy1 y-Coordinate of the first control point for the Bézier curve
	 * @param cpx2 x-Coordinate of the second control point for the Bézier curve
	 * @param cpy2 y-Coordinate of the second control point for the Bézier curve
	 * @param x x-Coordinate of point to draw the curve to
	 * @param y y-Coordinate of point to draw the curve to
	 */
	bezierCurveTo(cpx1: number, cpy1: number, cpx2: number, cpy2: number, x: number, y: number): void;

	// TODO
	// /**
	//  * Draws a circular arc segment with the specified radius that starts tangent to the line between the current point and the specified point ⟨x1, y1⟩
	//  * and ends tangent to the line between the specified points ⟨x1, y1⟩ and ⟨x2, y2⟩. If the first tangent point is not equal to the current point,
	//  * a straight line is drawn between the current point and the first tangent point. Equivalent to context.arcTo and uses SVG’s elliptical arc curve commands.
	//  *
	//  * @param x1 x-Coordinate of the first tangent point
	//  * @param y1 y-Coordinate of the first tangent point
	//  * @param x2 x-Coordinate of the second tangent point
	//  * @param y2 y-Coordinate of the second tangent point
	//  * @param r  Radius of the arc segment
	//  */
	// arcTo(x1: number, y1: number, x2: number, y2: number, radius: number): void;

	// TODO
	// /**
	//  * Creates a new subpath containing just the four points ⟨x, y⟩, ⟨x + w, y⟩, ⟨x + w, y + h⟩, ⟨x, y + h⟩,
	//  * with those four points connected by straight lines, and then marks the subpath as closed. Equivalent to context.rect and uses SVG’s “lineto” commands.
	//  *
	//  * @param x x-Coordinate of starting point for drawing the rectangle
	//  * @param y y-Coordinate of starting point for drawing the rectangle
	//  * @param w Width of rectangle
	//  * @param h Height of rectangle
	//  */
	// rect(x: number, y: number, w: number, h: number): void;
}

enum PathOp {
	MoveTo,
	ClosePath,
	LineTo,
	QuadraticCurveTo,
	BezierCurveTo,
}

class PathCommand {
	readonly op: PathOp;
	readonly args: readonly number[]

	constructor (op: PathOp, ...args: readonly number[]) {
		this.op = op;
		this.args = args;
	}
}

type IPathCommand = {
	op: PathOp.MoveTo;
	args: readonly [number, number];
} | {
	op: PathOp.ClosePath;
	args: readonly [];
} | {
	op: PathOp.LineTo;
	args: readonly [number, number];
} | {
	op: PathOp.BezierCurveTo;
	args: readonly [number, number, number, number, number, number];
}

export class Path implements IPath {
	get lastPoint(): Point | undefined {
		return this.contours[this.contours.length - 1]?.last;
	}

	private _commands: IPathCommand[] = [];

	constructor (
		public contours: Contour[] = [],
	) {}

	clone(): Path {
		const result = new Path(this.contours.map(c => c.clone()));
		result._commands = this._commands.slice();

		return result;
	}

	transform_inPlace(m: Const<Matrix>): void {
		for (let c of this.contours)
			c.transform_inPlace(m);

		this._commands = this._commands.map(cmd => {
			switch (cmd.op) {
				case PathOp.MoveTo:
				case PathOp.LineTo: {
					const [x, y] = cmd.args;
					const p = new Vec2(x, y);
					p.transform_inPlace(m);

					return new PathCommand(cmd.op, p.x, p.y) as IPathCommand;
				}
				case PathOp.BezierCurveTo: {
					const [x1, y1, x2, y2, x3, y3] = cmd.args;

					const p1 = new Vec2(x1, y1);
					const p2 = new Vec2(x2, y2);
					const p3 = new Vec2(x3, y3);

					p1.transform_inPlace(m);
					p2.transform_inPlace(m);
					p3.transform_inPlace(m);

					return new PathCommand(cmd.op, p1.x, p1.y, p2.x, p2.y, p3.x, p3.y) as IPathCommand;
				}
				default: {
					return cmd as IPathCommand;
				}
			}
		});
	}

	transform_new(m: Const<Matrix>): Path {
		const result = this.clone();
		result.transform_inPlace(m);

		return result;
	}

	moveTo(x: number, y: number) {
		this._commands.push(new PathCommand(PathOp.MoveTo, x, y) as IPathCommand);

		this.contours[this.contours.length-1]?.close();
		this.contours.push(new Contour([new Point(x, y)]));
	}

	lineTo(x: number, y: number) {
		this._commands.push(new PathCommand(PathOp.LineTo, x, y) as IPathCommand);
		this.contours[this.contours.length-1]?.points.push(new Point(x, y));
	}

	bezierCurveTo(
		cpx1: number, cpy1: number,
		cpx2: number, cpy2: number,
		x: number, y: number,
	) {
		this._commands.push(new PathCommand(
			PathOp.BezierCurveTo,
			cpx1, cpy1, cpx2, cpy2, x, y
		) as IPathCommand);

		if (!this.lastPoint)
			throw new Error("nocurrentpoint")

		this.lastPoint.handle_out = new Vec2(cpx1, cpy1);

		const endPoint = new Point(x, y);
		endPoint.handle_in = new Vec2(cpx2, cpy2);
		this.contours[this.contours.length-1].points.push(endPoint);
	}

	closePath() {
		this._commands.push(new PathCommand(PathOp.ClosePath) as IPathCommand);
		this.contours[this.contours.length-1]?.close();
	}

	replay(ctx: IPath): void {
		for (let cmd of this._commands) {
			switch (cmd.op) {
				case PathOp.MoveTo: {
					ctx.moveTo(...cmd.args);
					break;
				}
				case PathOp.ClosePath: {
					ctx.closePath();
					break;
				}
				case PathOp.LineTo: {
					ctx.lineTo(...cmd.args);
					break;
				}
				case PathOp.BezierCurveTo: {
					ctx.bezierCurveTo(...cmd.args);
					break;
				}
			}
		}
	}
}

export class Contour {
	get last(): Point | undefined {
		return this.points[this.points.length - 1];
	}

	closed = false;

	constructor (
		public points: Point[] = [],
	) {}

	close() {
		this.closed = true;
	}

	clone(): Contour {
		return new Contour(this.points.map(p => p.clone()));
	}

	transform_inPlace(m: Const<Matrix>): void {
		for (let p of this.points)
			p.transform_inPlace(m);
	}

	transform_new(m: Const<Matrix>): Contour {
		const result = this.clone();
		result.transform_inPlace(m);

		return result;
	}
}

export class Point {
	coords: Vec2;
	handle_in?: Vec2;
	handle_out?: Vec2;

	get x() { return this.coords.x; }
	get y() { return this.coords.y; }

	constructor (x: number, y: number) {
		this.coords = new Vec2(x, y);
	}

	clone(): Point {
		const result = new Point(this.x, this.y);
		result.handle_in = this.handle_in?.clone();
		result.handle_out = this.handle_out?.clone();

		return result;
	}

	transform_inPlace(m: Const<Matrix>): void {
		this.coords.transform_inPlace(m);
		this.handle_in?.transform_inPlace(m);
		this.handle_out?.transform_inPlace(m);
	}

	transform_new(m: Const<Matrix>): Point {
		const result = this.clone();
		result.transform_inPlace(m);

		return result;
	}
}

export class Vec2 {
	static Zero: Const<Vec2> = new Vec2(0, 0);
	static Unit: Const<Vec2> = new Vec2(1, 1);

	constructor (
		public x: number,
		public y: number,
	) {}

	clone(): Vec2 {
		return new Vec2(this.x, this.y);
	}

	transform_inPlace(m: Const<Matrix>): void {
		const [x, y] = [this.x, this.y];
		this.x = (x*m.m11 + y*m.m21 + m.m31);
		this.y = (x*m.m12 + y*m.m22 + m.m32);
	}

	transform_new(m: Const<Matrix>): Vec2 {
		const result = this.clone();
		result.transform_inPlace(m);

		return result;
	}
}
