import { assert, Const, exists, Fn, match, Option, Stack } from "@electric/utils";
import { Subject } from "rxjs";

import { Matrix, nearlyEq, vec2, Vec2 } from "../math";
import { pathCommand, PathCommand, PathOp } from "./path-command";
import { EditPayload, Transaction, TransactionType } from "./transaction";

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

export interface AutoSmoothOptions {
	inPlace: boolean;
}

export interface PointTransformFn {
	(target: Const<Point>, prev: Const<Point>, next: Const<Point>): Point | Const<Point>;
}

export class Path implements IPath {
	private _changes$ = new Subject<void>();
	changes$ = this._changes$.asObservable();

	get lastPoint(): Point | undefined {
		return this.contours[this.contours.length - 1]?.last;
	}

	private _svg?: string;
	get svg(): string { return this._svg ??= this._commands.join(""); }

	private _commands: PathCommand[] = [];

	// TODO: Could make the capacity configurable with a warning about memory
	//       consumption, similar to Blender
	private _undoStack = new Stack<Transaction>(1024);
	private _redoStack = new Stack<Transaction>(1024);
	private _inProgress?: Transaction;
	private _recording = false;

	constructor (
		public contours: Contour[] = [],
	) {}

	clone(): Path {
		const result = new Path(this.contours.map(c => c.clone()));
		result._commands = this._commands.map(cmd => cmd.clone() as PathCommand);

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
					const p = m.transformPoint(x, y);

					this._commands[i] = pathCommand(cmd.op, p.x, p.y, smooth);
					break;
				}
				case PathOp.QuadraticCurveTo: {
					const [x1, y1, x2, y2, smooth] = cmd.args;
					const p1 = m.transformPoint(x1, y1);
					const p2 = m.transformPoint(x2, y2);

					this._commands[i] = pathCommand(cmd.op, p1.x, p1.y, p2.x, p2.y, smooth);
					break;
				}
				case PathOp.BezierCurveTo: {
					const [x1, y1, x2, y2, x3, y3, smooth] = cmd.args;
					const p1 = m.transformPoint(x1, y1);
					const p2 = m.transformPoint(x2, y2);
					const p3 = m.transformPoint(x3, y3);

					this._commands[i] = pathCommand(cmd.op, p1.x, p1.y, p2.x, p2.y, p3.x, p3.y, smooth);
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

	print(): string {
		let result: string[] = [];
		let cmdIdx = 0;
		result.push("Path {");

		this.contours.forEach((contour, c) => {
			result.push(`  [${c}] Contour {`);

			contour.points.forEach((point, p) => {
				result.push(`    [${p}] Point {`);

				const cmd = this._commands[cmdIdx];
				if (cmd) {
					result.push(
						`      [${cmdIdx}] ${PathOp[cmd.op]} (${cmd.args.filter(exists).join(", ")})`,
						"      " + point.toString(),
					);
				}
				else {
					result.push(
						"      <NO COMMAND>",
						"      " + point.toString(),
					);
				}

				result.push("    }");
				cmdIdx++;
			});

			result.push("  }");
		});

		while (cmdIdx < this._commands.length) {
			const cmd = this._commands[cmdIdx];
			result.push(`  [${cmdIdx}] ${PathOp[cmd.op]} (${cmd.args.filter(exists).join(", ")})`);
			cmdIdx++;
		}

		result.push("}");

		return result.join("\n");
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
						p0 = prev.coords;
					}
					else if (!p0) {
						return target;
					}

					let p2 = target.handle_out;
					if (!p2 && !next.handle_in) {
						p2 = next.coords;
					}
					else if (!p2) {
						return target;
					}

					const p1 = target.coords;

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

	beginTransaction(): void {
		this._recording = true;
		this._inProgress ??= [];
	}

	endTransaction(): void {
		this._recording = false;

		if (this._inProgress?.length) {
			this._undoStack.push(this._inProgress);
			delete this._inProgress;
			this._redoStack.clear();
		}
	}

	undo(): void {
		const transaction = this._undoStack.pop()?.slice();
		if (!transaction) return;

		this._redoStack.push(transaction.slice());

		while (transaction.length) {
			const entry = transaction.pop()!;
			switch (entry.type) {
				case TransactionType.Edit: {
					const { index, prev } = entry.payload;
					this._commands[index] = prev.clone() as PathCommand;
					break;
				}
				default: {
					console.error(
						`TransactionType "${TransactionType[entry.type]}" not yet implemented!`
					);
				}
			}
		}

		// TODO: Do this less wastefully lol
		const proxy = new Path();
		this.replay(proxy);
		this.contours = proxy.contours;
		this.cleanup({ autoSmooth: false });

		delete this._svg;
		this._changes$.next();
	}

	redo(): void {
		const transaction = this._redoStack.pop()?.slice();
		if (!transaction) return;

		this._undoStack.push(transaction.slice());

		for (let entry of transaction) {
			switch (entry.type) {
				case TransactionType.Edit: {
					const { index, next } = entry.payload;
					this._commands[index] = next.clone() as PathCommand;
					break;
				}
				default: {
					console.error(`TransactionType ${entry.type} not yet implemented!`);
				}
			}
		}

		// TODO: Do this less wastefully lol
		const proxy = new Path();
		this.replay(proxy);
		this.contours = proxy.contours;
		this.cleanup({ autoSmooth: false });

		delete this._svg;
		this._changes$.next();
	}

	private recordEdit_before(cmd: PathCommand): Option<Omit<EditPayload, "next">> {
		if (!this._recording) return null;

		const index = this._commands.indexOf(cmd);
		const prev = cmd.clone() as PathCommand;

		return { index, prev };
	}

	private recordEdit_after(cmd: PathCommand, partial: Option<Omit<EditPayload, "next">>) {
		if (!this._recording) return;

		assert(this._inProgress != null);
		assert(partial != null);

		const next = cmd.clone() as PathCommand;
		const transaction = this._inProgress.find(it => (
			it.type === TransactionType.Edit
			&& it.payload.index === partial.index
		));

		if (transaction)
			(transaction.payload as EditPayload).next = next;
		else
			this._inProgress.push({
				type: TransactionType.Edit as const,
				payload: { ...partial, next },
			});
	}

	private recordEdit(cmd: PathCommand, doEdit: Fn<[], void>): void {
		const partial = this.recordEdit_before(cmd);
		doEdit();
		this.recordEdit_after(cmd, partial);
	}

	// FIXME: This function is a mess!
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

		const contour = this.contours[contourIndex];

		const prevIndex = pointIndex === 0
			? contour.points.length - 1
			: pointIndex - 1;

		const nextIndex = (pointIndex + 1) % contour.points.length;

		const target = contour.points[pointIndex];
		const prev = contour.points[prevIndex];
		const next = contour.points[nextIndex];

		const cmd = this._commands[cmdBaseIndex + pointIndex];
		const cmdNext = this._commands[cmdBaseIndex + nextIndex];
		const cmdMerged = pointIndex === 0 && contour.last?.hidden
			? this._commands[cmdBaseIndex + contour.points.length - 1]
			: undefined;

		const updated = edit(target, prev, next) as Point;
		if (updated === target)
			return;

		if (updated.smooth !== Boolean(target.smooth)) {
			this.recordEdit(cmd, () => {
				cmd.args.splice(cmd.args.length-1, 1, updated.smooth);
				delete (cmd as any)["_str"];
			});
		}

		if (!vec2.nearlyEq(updated.coords, target.coords, 1e-5)) {
			const { x, y } = updated.coords;
			for (let coordsCmd of [cmd, cmdMerged].filter(exists)) {
				this.recordEdit(coordsCmd, () => {
					match (coordsCmd.op, {
						[PathOp.MoveTo]: () => coordsCmd.args.splice(0, 2, x, y),
						[PathOp.LineTo]: () => coordsCmd.args.splice(0, 2, x, y),
						[PathOp.BezierCurveTo]: () => coordsCmd.args.splice(4, 2, x, y),
						[PathOp.QuadraticCurveTo]: () => {
							throw new Error("Editing quadratic curves is not yet supported");
						},
						_: () => assert(false),
					});

					delete (coordsCmd as any)["_str"];
				});
			}
		}

		if (Boolean(updated.handle_in) !== Boolean(target.handle_in)
			|| Boolean(updated.handle_out) !== Boolean(target.handle_out))
		{
			console.warn("Adding/removing control points is not yet supported!");
		}
		else {
			if (updated.handle_in
				&& !vec2.nearlyEq(updated.handle_in, target.handle_in!, 1e-5))
			{
				const handleCmd = cmdMerged ?? cmd;
				assert(
					handleCmd.op === PathOp.BezierCurveTo,
					`Expected ${PathOp[PathOp.BezierCurveTo]}, found ${PathOp[handleCmd.op]}`
				);

				const { x, y } = updated.handle_in!;

				this.recordEdit(handleCmd, () => {
					handleCmd.args.splice(2, 2, x, y);
					delete (handleCmd as any)["_str"];
				});
			}

			if (updated.handle_out
				&& !vec2.nearlyEq(updated.handle_out, target.handle_out!, 1e-5))
			{
				assert(
					cmdNext.op === PathOp.BezierCurveTo,
					`Expected ${PathOp[PathOp.BezierCurveTo]}, found ${PathOp[cmdNext.op]}`
				);
				const { x, y } = updated.handle_out;

				this.recordEdit(cmdNext, () => {
					cmdNext.args.splice(0, 2, x, y);
					delete (cmdNext as any)["_str"];
				});
			}
		}

		contour.points[pointIndex] = updated;

		if (pointIndex === 0 && contour.last?.hidden) {
			contour.last.coords = updated.coords;
			contour.last.handle_in = updated.handle_in;
		}

		delete this._svg;
		this._changes$.next();
	}

	moveTo(x: number, y: number, smooth?: boolean) {
		// FIXME: This breaks the 1:1 mapping between contour+point indices and
		//        command indices. Maybe we could insert these as phantom calls
		//        in the toString / replay functions? It's pretty fugly and error-
		//        prone to keep checking for the missing stroke at render time.
		// if (this.lastPoint != null)
		// 	this.closePath();

		this._commands.push(pathCommand(PathOp.MoveTo, x, y, smooth));
		this.contours[this.contours.length-1]?.close();
		this.contours.push(new Contour([new Point(x, y, smooth)]));
	}

	lineTo(x: number, y: number, smooth?: boolean) {
		this._commands.push(pathCommand(PathOp.LineTo, x, y, smooth));
		this.contours[this.contours.length-1]?.points.push(new Point(x, y, smooth));
	}

	quadraticCurveTo(
		cpx: number, cpy: number,
		x: number, y: number,
		smooth?: boolean,
	) {
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

		p.handle_out = vec2(cpx1, cpy1);
		p.smooth = smooth ?? false;

		const endPoint = new Point(x, y, smooth);
		endPoint.handle_in = vec2(cpx2, cpy2);

		this._commands.push(pathCommand(PathOp.QuadraticCurveTo, cpx, cpy, x, y, smooth));
		this.contours[this.contours.length-1].points.push(endPoint);
	}

	bezierCurveTo(
		cpx1: number, cpy1: number,
		cpx2: number, cpy2: number,
		x: number, y: number,
		smooth?: boolean,
	) {
		if (!this.lastPoint) {
			console.error("nocurrentpoint");
			return;
		}

		const cp1 = vec2(cpx1, cpy1);
		if (!this.lastPoint.handle_out
			&& !vec2.nearlyEq(this.lastPoint.coords, cp1, 1e-5))
		{
			this.lastPoint.handle_out = cp1;
		}

		const endPoint = new Point(x, y, smooth);
		if (!nearlyEq(x, cpx2, 1e-5) || !nearlyEq(y, cpy2, 1e-5))
			endPoint.handle_in = vec2(cpx2, cpy2);

		this._commands.push(pathCommand(PathOp.BezierCurveTo, cpx1, cpy1, cpx2, cpy2, x, y, smooth));
		this.contours[this.contours.length-1].points.push(endPoint);
	}

	closePath() {
		this._commands.push(pathCommand(PathOp.ClosePath));
		this.contours[this.contours.length-1]?.close();
	}

	cleanup(options?: { autoSmooth: boolean }): void {
		for (let contour of this.contours) {
			// Merge duplicate points
			const first = contour.points[0];
			const last = contour.last;
			if (!first || !last) continue;

			if (first !== last && vec2.nearlyEq(first.coords, last.coords, 1e-5)) {
				first.handle_in = last.handle_in;
				last.hidden = true;
			}
		}

		if (options?.autoSmooth)
			this.autoSmooth({ inPlace: true });
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
		closed = false,
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
		this.coords = vec2(x, y);
		this.smooth = smooth ?? false;
		this.hidden = hidden ?? false;
	}

	clone(): Point {
		const result = new Point(
			this.x, this.y,
			this.smooth,
			this.hidden,
		);

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

		if (this.hidden)
			result += ` <hidden>`;

		return result;
	}

	round(): void {
		this.coords.x = Math.round(this.x);
		this.coords.y = Math.round(this.y);

		if (this.handle_in) {
			this.handle_in.x = Math.round(this.handle_in.x);
			this.handle_in.y = Math.round(this.handle_in.y);
		}

		if (this.handle_out) {
			this.handle_out.x = Math.round(this.handle_out.x);
			this.handle_out.y = Math.round(this.handle_out.y);
		}
	}
}
