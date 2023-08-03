import { Const } from "@electric/utils";

import { Matrix, vec2, Vec2 } from "../math";

export interface IPath {
	/**
	 * Move to the specified point ⟨x, y⟩. Equivalent to context.moveTo and SVG’s
	 * “moveto” command.
	 *
	 * @param x x-Coordinate of point to move to
	 * @param y y-Coordinate of point to move to
	 */
	moveTo(x: number, y: number, smooth?: boolean): void;

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
	lineTo(x: number, y: number, smooth?: boolean): void;

	/**
	 * Draws a quadratic Bézier segment from the current point to the specified
	 * point ⟨x, y⟩, with the specified control point ⟨cpx, cpy⟩. Equivalent to
	 * context.quadraticCurveTo and SVG’s quadratic Bézier curve commands.
	 *
	 * @param cpx x-Coordinate of the control point for the quadratic Bézier curve
	 * @param cpy y-Coordinate of the control point for the quadratic Bézier curve
	 * @param x x-Coordinate of point to draw the curve to
	 * @param y y-Coordinate of point to draw the curve to
	 */
	quadraticCurveTo(
		cpx: number, cpy: number,
		x: number, y: number,
		smooth?: boolean,
	): void;

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
	bezierCurveTo(
		cpx1: number, cpy1: number,
		cpx2: number, cpy2: number,
		x: number, y: number,
		smooth?: boolean,
	): void;

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
	readonly args: readonly any[]

	constructor (op: PathOp, ...args: readonly any[]) {
		this.op = op;
		this.args = args;
	}
}

type IPathCommand = {
	op: PathOp.MoveTo;
	args: readonly [number, number, boolean?];
} | {
	op: PathOp.ClosePath;
	args: readonly [];
} | {
	op: PathOp.LineTo;
	args: readonly [number, number, boolean?];
} | {
	op: PathOp.QuadraticCurveTo;
	args: readonly [number, number, number, number, boolean?];
} | {
	op: PathOp.BezierCurveTo;
	args: readonly [number, number, number, number, number, number, boolean?];
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

		for (let i = 0; i < this._commands.length; ++i) {
			const cmd = this._commands[i];
			switch (cmd.op) {
				case PathOp.MoveTo:
				case PathOp.LineTo: {
					const [x, y, smooth] = cmd.args;
					const p = m.transformPoint(vec2(x, y));

					this._commands[i] = new PathCommand(cmd.op, p.x, p.y, smooth) as IPathCommand;
					break;
				}
				case PathOp.QuadraticCurveTo: {
					const [x1, y1, x2, y2, smooth] = cmd.args;
					const p1 = m.transformPoint(vec2(x1, y1));
					const p2 = m.transformPoint(vec2(x2, y2));

					this._commands[i] = new PathCommand(
						cmd.op,
						p1.x, p1.y,
						p2.x, p2.y,
						smooth,
					) as IPathCommand;

					break;
				}
				case PathOp.BezierCurveTo: {
					const [x1, y1, x2, y2, x3, y3, smooth] = cmd.args;
					const p1 = m.transformPoint(vec2(x1, y1));
					const p2 = m.transformPoint(vec2(x2, y2));
					const p3 = m.transformPoint(vec2(x3, y3));

					this._commands[i] = new PathCommand(
						cmd.op,
						p1.x, p1.y,
						p2.x, p2.y,
						p3.x, p3.y,
						smooth,
					) as IPathCommand;

					break;
				}
			}
		}
	}

	transform_new(m: Const<Matrix>): Path {
		const result = this.clone();
		result.transform_inPlace(m);

		return result;
	}

	moveTo(x: number, y: number, smooth?: boolean) {
		this._commands.push(new PathCommand(PathOp.MoveTo, x, y, smooth) as IPathCommand);

		this.contours[this.contours.length-1]?.close();
		this.contours.push(new Contour([new Point(x, y, smooth)]));
	}

	lineTo(x: number, y: number, smooth?: boolean) {
		this._commands.push(new PathCommand(PathOp.LineTo, x, y, smooth) as IPathCommand);
		this.contours[this.contours.length-1]?.points.push(new Point(x, y, smooth));
	}

	quadraticCurveTo(
		cpx: number, cpy: number,
		x: number, y: number,
		smooth?: boolean,
	) {
		this._commands.push(new PathCommand(
			PathOp.QuadraticCurveTo,
			cpx, cpy, x, y, smooth,
		) as IPathCommand);

		if (!this.lastPoint) {
			console.error("nocurrentpoint");
			return;
		}

		// https://fontforge.org/docs/techref/bezier.html#converting-truetype-to-postscript
		const p = this.lastPoint;
		const twoThirds = 2 / 3;

		const cpx1 = p.x + twoThirds * (cpx - p.x);
		const cpy1 = p.y + twoThirds * (cpy - p.y);

		const cpx2 = x + twoThirds * (cpx - x);
		const cpy2 = y + twoThirds * (cpy - y);

		p.handle_out = new Vec2(cpx1, cpy1);
		p.smooth = smooth ?? false;

		const endPoint = new Point(x, y, smooth);
		endPoint.handle_in = new Vec2(cpx2, cpy2);

		this.contours[this.contours.length-1].points.push(endPoint);
	}

	bezierCurveTo(
		cpx1: number, cpy1: number,
		cpx2: number, cpy2: number,
		x: number, y: number,
		smooth?: boolean,
	) {
		this._commands.push(new PathCommand(
			PathOp.BezierCurveTo,
			cpx1, cpy1, cpx2, cpy2, x, y, smooth,
		) as IPathCommand);

		if (!this.lastPoint) {
			console.error("nocurrentpoint");
			return;
		}

		this.lastPoint.handle_out = new Vec2(cpx1, cpy1);

		const endPoint = new Point(x, y, smooth);
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
				case PathOp.QuadraticCurveTo: {
					ctx.quadraticCurveTo(...cmd.args);
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
	smooth = false;

	get x() { return this.coords.x; }
	get y() { return this.coords.y; }

	constructor (x: number, y: number, smooth?: boolean) {
		this.coords = new Vec2(x, y);
		this.smooth = smooth ?? false;
	}

	clone(): Point {
		const result = new Point(this.x, this.y);
		result.handle_in = this.handle_in?.clone();
		result.handle_out = this.handle_out?.clone();

		return result;
	}

	transform_inPlace(m: Const<Matrix>): void {
		m.transformPoint_inPlace(this.coords);
		if (this.handle_in)
			m.transformPoint_inPlace(this.handle_in);
		if (this.handle_out)
			m.transformPoint_inPlace(this.handle_out);
	}

	transform_new(m: Const<Matrix>): Point {
		const result = this.clone();
		result.transform_inPlace(m);

		return result;
	}
}
