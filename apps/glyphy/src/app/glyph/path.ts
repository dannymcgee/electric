import { Const, exists } from "@electric/utils";

import { Matrix, nearlyEq, vec2, Vec2 } from "../math";

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
	op: PathOp;
	args: any[]

	constructor (op: PathOp, ...args: any[]) {
		this.op = op;
		this.args = args;
	}
}

type IPathCommand = {
	op: PathOp.MoveTo;
	args: [number, number, boolean?];
} | {
	op: PathOp.ClosePath;
	args: [];
} | {
	op: PathOp.LineTo;
	args: [number, number, boolean?];
} | {
	op: PathOp.QuadraticCurveTo;
	args: [number, number, number, number, boolean?];
} | {
	op: PathOp.BezierCurveTo;
	args: [number, number, number, number, number, number, boolean?];
}

export interface AutoSmoothOptions {
	inPlace: boolean;
}

export interface PointTransformFn {
	(target: Const<Point>, prev: Const<Point>, next: Const<Point>): Point | Const<Point>;
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

	printCommands(): string {
		return this._commands
			.map((cmd, i) => {
				const op = PathOp[cmd.op];
				return `[${i}] ${op} (${cmd.args.filter(exists).join(", ")})`;
			})
			.join("\n");
	}

	autoSmooth(options: { inPlace: true }): void;
	autoSmooth(options?: { inPlace: false }): Path;
	autoSmooth(options?: AutoSmoothOptions): void | Path {
		const result = options?.inPlace ? this : this.clone();

		for (let c = 0; c < result.contours.length; ++c) {
			for (let p = 0; p < result.contours[c].points.length; ++p) {
				result.editPoint(c, p, (target, prev, next) => {
					if (!target.handle_in && !target.handle_out)
						return target;

					let p0 = target.handle_in;
					if (!p0 && !prev.handle_out) {
						p0 = prev.coords as Vec2;
					}
					else if (!p0) {
						return target;
					}

					let p2 = target.handle_out;
					if (!p2 && !next.handle_in) {
						p2 = next.coords as Vec2;
					}
					else if (!p2) {
						return target;
					}

					const p1 = target.coords as Vec2;

					const smooth = vec2.areCollinear(p0, p1, p2);

					if (smooth !== Boolean(target.smooth)) {
						const result = target.clone();
						result.smooth = smooth;

						return result;
					}

					return target;
				});
			}
		}

		if (!options?.inPlace)
			return result;
	}

	editPoint(contourIndex: number, pointIndex: number, edit: PointTransformFn): void {
		if (!this.contours[contourIndex]?.points[pointIndex])
			throw new Error(
				`Invalid point identifier: no point exists at path[${
					contourIndex
				}][${
					pointIndex
				}]`);

		let cmdBaseIndex = 0;
		for (let c = 0; c < contourIndex; ++c)
			cmdBaseIndex += this.contours[c].points.length;

		const cmd = this._commands[cmdBaseIndex + pointIndex];

		const contour = this.contours[contourIndex];
		const target = contour.points[pointIndex];

		const prevIndex = pointIndex === 0
			? contour.points.length - 1
			: pointIndex - 1;

		const nextIndex = (pointIndex + 1) % contour.points.length;

		const prev = contour.points[prevIndex];
		const next = contour.points[nextIndex];

		const updated = edit(target, prev, next);
		if (updated === target)
			return;

		// TODO: Update point coords, handle positions, etc.
		if (updated.smooth !== Boolean(target.smooth))
			cmd.args.splice(cmd.args.length-1, 1, updated.smooth);

		contour.points[pointIndex] = updated as Point;
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

		if (!this.lastPoint.handle_out
			&& (!nearlyEq(this.lastPoint.coords.x, cpx1, 1e-5)
				|| !nearlyEq(this.lastPoint.coords.y, cpy1, 1e-5)))
		{
			this.lastPoint.handle_out = new Vec2(cpx1, cpy1);
		}

		const endPoint = new Point(x, y, smooth);
		if (!nearlyEq(x, cpx2, 1e-5) || !nearlyEq(y, cpy2, 1e-5))
			endPoint.handle_in = new Vec2(cpx2, cpy2);

		this.contours[this.contours.length-1].points.push(endPoint);
	}

	closePath() {
		this._commands.push(new PathCommand(PathOp.ClosePath) as IPathCommand);
		this.contours[this.contours.length-1]?.close();
	}

	cleanup(options?: { autoSmooth: boolean }): void {
		if (options?.autoSmooth)
			this.autoSmooth({ inPlace: true });

		for (let contour of this.contours) {
			// Merge duplicate points
			const first = contour.points[0];
			const last = contour.last;
			if (!first || !last) continue;

			if (first !== last
				&& nearlyEq(first.coords.x, last.coords.x, 1e-5)
				&& nearlyEq(first.coords.y, last.coords.y, 1e-5))
			{
				// These points can be merged, but to avoid disrupting the canonical
				// representation of the path, we'll just hide the first point when
				// rendering.
				first.hidden = true;

				if (options?.autoSmooth) {
					// Re-check for auto-smooth
					if (!last.handle_in || !first.handle_out)
						continue;

					const smooth = vec2.areCollinear(
						last.handle_in,
						first.coords,
						first.handle_out,
					);

					if (smooth) {
						this.editPoint(
							this.contours.indexOf(contour),
							contour.points.length - 1,
							point => {
								const result = point.clone();
								result.smooth = true;

								return result;
							},
						);
					}
				}
			}
		}
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
	points: Point[];
	closed: boolean;

	get last(): Point | undefined {
		return this.points[this.points.length - 1];
	}

	constructor (
		points: Point[] = [],
		closed = false
	) {
		this.points = points;
		this.closed = closed;
	}

	close() {
		this.closed = true;
	}

	clone(): Contour {
		return new Contour(this.points.map(p => p.clone()), this.closed);
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
	hidden = false;

	get x() { return this.coords.x; }
	get y() { return this.coords.y; }

	constructor (
		x: number, y: number,
		smooth?: boolean,
		hidden?: boolean,
	) {
		this.coords = new Vec2(x, y);
		this.smooth = smooth ?? false;
		this.hidden = hidden ?? false;
	}

	clone(): Point {
		const result = new Point(this.x, this.y, this.smooth, this.hidden);
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

	toString(): string {
		let result = `(${
			this.handle_in?.join(",")
		}) <- (${
			this.coords.join(",")
		}) -> (${
			this.handle_out?.join(",")
		})`;

		if (this.smooth)
			result += ` [smooth]`;

		return result;
	}
}
