export enum PathOp {
	MoveTo,
	ClosePath,
	LineTo,
	QuadraticCurveTo,
	BezierCurveTo,
}

export function pathCommand<Op extends PathOp>(
	op: Op,
	...args: PathCommandArgs<Op>
): PathCommand<Op> {
	return new _PathCommand(op, ...args) as PathCommand<Op>;
}

interface IPathCommand {
	op: PathOp;
	args: []
		| [number, number, (boolean|undefined)]
		| [number, number, number, number, (boolean|undefined)]
		| [number, number, number, number, number, number, (boolean|undefined)];
	clone(): IPathCommand;
}

export interface MoveToCommand extends IPathCommand {
	op: PathOp.MoveTo;
	args: [number, number, (boolean|undefined)];
}

export interface LineToCommand extends IPathCommand {
	op: PathOp.LineTo;
	args: [number, number, (boolean|undefined)];
}

export interface ClosePathCommand extends IPathCommand {
	op: PathOp.ClosePath;
	args: [];
}

export interface QuadraticCurveCommand extends IPathCommand {
	op: PathOp.QuadraticCurveTo;
	args: [number, number, number, number, (boolean|undefined)];
}

export interface BezierCurveCommand extends IPathCommand {
	op: PathOp.BezierCurveTo;
	args: [number, number, number, number, number, number, (boolean|undefined)];
}

type PathCommandUnion
	= MoveToCommand
	| LineToCommand
	| ClosePathCommand
	| QuadraticCurveCommand
	| BezierCurveCommand;

export type PathCommand<Op extends PathOp = PathOp>
	= Op extends PathOp.MoveTo ? MoveToCommand
	: Op extends PathOp.LineTo ? LineToCommand
	: Op extends PathOp.ClosePath ? ClosePathCommand
	: Op extends PathOp.QuadraticCurveTo ? QuadraticCurveCommand
	: Op extends PathOp.BezierCurveTo ? BezierCurveCommand
	: PathCommandUnion;

type PathCommandArgs<Op extends PathOp>
	= PathCommand<Op>["args"];

class _PathCommand implements IPathCommand {
	op: PathOp;
	args: PathCommandArgs<PathOp>;

	constructor (op: PathOp, ...args: PathCommandArgs<typeof op>) {
		this.op = op;
		this.args = args;
	}

	clone(): _PathCommand {
		return new _PathCommand(this.op, ...this.args);
	}
}
