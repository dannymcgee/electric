import { Const, exists } from "@electric/utils";

import { Path } from "../glyph";
import { CFFTable } from "../open-type";

enum HintOp {
	hstem     = 0x01,
	hstemhm,
	vstem     = 0x03,
	vstemhm,
	cntrmask,
	hintmask,
}

enum OpCode {
	endchar          = 0x0E,
	hsbw             = 0x0D,
	closepath        = 0x09,
	hlineto          = 0x06,
	hmoveto          = 0x16,
	hvcurveto        = 0x1F,
	rlineto          = 0x05,
	rmoveto          = 0x15,
	rcurveline       = 0x18,
	rlinecurve       = 0x19,
	vvcurveto        = 0x1A,
	hhcurveto        = 0x1B,
	rrcurveto        = 0x08,
	vhcurveto        = 0x1E,
	vlineto          = 0x07,
	vmoveto          = 0x04,
	callsubr         = 0x0A,
	callgsubr        = 0x1C,
	return           = 0x0B,
	dotsection       = 0x0C_00,
	vstem3           = 0x0C_01,
	hstem3           = 0x0C_02,
	seac             = 0x0C_06,
	sbw              = 0x0C_07,
	div              = 0x0C_0C,
	callothersubr    = 0x0C_10,
	pop              = 0x0C_11,
	setcurrentpoint  = 0x0C_21,
	hflex            = 0x0C_22,
	flex             = 0x0C_23,
	hflex1           = 0x0C_24,
	flex1            = 0x0C_25,
}

type CommandKey = Exclude<(keyof typeof OpCode | keyof typeof HintOp), number>;
type CommandList = {
	[K in CommandKey]: (...args: number[]) => void;
}

type Point = [number, number]
type Stack = (number | CommandKey)[];

class Subroutines extends Array<Const<Stack>> {
	private _bias?: number;
	get bias() {
		return this._bias ??=
			this.length < 1240  ? 107 :
			this.length < 33900 ? 1131
			                    : 32768;
	}

	get(index: number): Const<Stack> | null {
		const result = this[index + this.bias];
		if (!result) {
			console.error(`Couldn't find subroutine at index ${index + this.bias}!`);
			console.error(this);
			return null;
		}

		return result;
	}
}

export class InterpreterCFF2 {
	private _stack: Stack = [];
	private _currentPoint: Point = [0, 0];
	private _charStrings = new Map<string, Const<Stack>>();
	private _subrs = new Subroutines();
	private _globalSubrs = new Subroutines();

	private _path = new Path();
	get path(): Const<Path> { return this._path; }

	constructor (table: CFFTable) {
		for (let charString of table.globalSubrs?.value ?? [])
			this._globalSubrs.push(this.parse(charString.program));

		for (let charString of table.cffFont.privateTable.subrs?.value ?? [])
			this._subrs.push(this.parse(charString.program));

		for (let [name, charString] of table.cffFont.charStrings)
			this._charStrings.set(name, this.parse(charString.program));
	}

	interpret(glyphName: string): Path {
		// console.log("");
		// console.log(`Interpreting glyph: "${glyphName}"`);
		this._currentPoint = [0, 0];
		this._path = new Path();

		const stack = this._charStrings.get(glyphName);
		if (!stack) {
			console.error(`Failed to find glyph with name "${glyphName}"`);
			return this._path;
		}

		this._stack = stack.slice();
		this.eval();

		return this._path;
	}

	private parse(charString: string): Const<Stack> {
		return charString
			.split(/\r?\n/)
			.flatMap(line => line
				// hintmasks are presented with the operand _before_ the operator,
				// unlike all of the other commands. The reason why may become clear
				// when I get around to implementing hints, but in the meantime I'll
				// flip these for the sake of my sanity.
				.replace(/(hintmask) ([10]+)/g, "$2 $1")
				.split(/\s+/)
			)
			.map(token => {
				if (!token) return null;

				if (/^[-.0-9]+$/.test(token))
					return parseFloat(token);

				if (token in OpCode || token in HintOp)
					return token as CommandKey;

				console.error(`Unhandled token: "${token}"`);
				return token as any;
			})
			.filter(exists)
			.reverse();
	}

	/**
	 * @see https://learn.microsoft.com/en-us/typography/opentype/spec/cff2charstr
	 * @see https://adobe-type-tools.github.io/font-tech-notes/pdfs/T1_SPEC.pdf
	 * @see https://adobe-type-tools.github.io/font-tech-notes/pdfs/5177.Type2.pdf
	 * @see https://www.adobe.com/jp/print/postscript/pdfs/PLRM.pdf
	 */
	private eval(): void {
		const args: number[] = [];
		while (this._stack.length) {
			args.length = 0;

			let next = this._stack.pop();
			while (typeof next === "number") {
				args.push(next)
				next = this._stack.pop();
			}

			if (next == null)
				break;

			if (next in HintOp)
				continue;

			if (!(next in OpCode)) {
				console.error(`SKIPPING: ${next}(${args.join(", ")})`);
				continue;
			}

			const cmd = this[next];

			if (/callg?subr/.test(cmd.name)) {
				const arg = args.pop()!;
				(cmd as CommandList[CommandKey]).call(this, arg);

				while (args.length)
					this._stack.push(args.pop()!);

				continue;
			}

			if (cmd.length && args.length > cmd.length) {
				console.warn(
					`Operator "${cmd.name}" expects ${cmd.length} arguments, `
					+ `but ${args.length} were provided!`
				);
			}

			// console.log(`${cmd.name}(${args.join(", ")})`);
			(cmd as CommandList[CommandKey]).call(this, ...args);
		}
	}

	/**
	 * finishes a charstring outline definition and must be the last command in a
	 * character’s outline (except for accented characters defined using seac).
	 * When endchar is executed, Type 1 BuildChar performs several tasks. It
	 * executes a setcachedevice operation, using a bounding box it computes
	 * directly from the character outline and using the width information
	 * acquired from a previous hsbw or sbw operation. (Note that this is not the
	 * same order of events as in Type 3 Fonts.) BuildChar then calls a special
	 * version of fill or stroke depending on the value of PaintType in the font
	 * dictionary. The Type 1 font format supports only PaintType 0 (fill) and 2
	 * (outline). Note that this single fill or stroke implies that there can be
	 * only one path (possibly containing several subpaths) that can be created
	 * to be filled or stroked by the endchar command.
	 */
	private endchar(): void {
		this.closepath();
	}

	/**
	 * sets the left sidebearing point at (sbx, 0) and sets the character width
	 * vector to (wx, 0) in character space. This command also sets the current
	 * point to (sbx, 0), but does not place the point in the character path. Use
	 * rmoveto for the first point in the path. The name hsbw stands for
	 * horizontal sidebearing and width; horizontal indicates that the y
	 * component of both the sidebearing and width is 0. Either sbw or hsbw must
	 * be used once as the first command in a character outline definition. It
	 * must be used only once. In non-marking characters, such as the space
	 * character, the left sidebearing point should be (0, 0).
	 */
	private hsbw(sbx: number, wx: number): void {}

	/**
	 * for standard encoding accented character, makes an accented character from
	 * two other characters in its font program. The asb argument is the x
	 * component of the left sidebearing of the accent; this value must be the
	 * same as the sidebearing value given in the hsbw or sbw command in the
	 * accent’s own charstring. The origin of the accent is placed at (adx, ady)
	 * relative to the origin of the base character. The bchar argument is the
	 * character code of the base character, and the achar argument is the
	 * character code of the accent character. Both bchar and achar are codes
	 * that these characters are assigned in the Adobe StandardEncoding vector,
	 * given in an Appendix in the PostScript Language Reference Manual.
	 * Furthermore, the characters represented by achar and bchar must be in the
	 * same positions in the font’s encoding vector as the positions they occupy
	 * in the Adobe StandardEncoding vector. If the name of both components of an
	 * accented character do not appear in the Adobe StandardEncoding vector, the
	 * accented character cannot be built using the seac command.
	 *
	 * The FontBBox entry in the font dictionary must be large enough to
	 * accommodate both parts of the accented character. The sbw or hsbw command
	 * that begins the accented character must be the same as the corresponding
	 * command in the base character. Finally, seac is the last command in the
	 * charstring for the accented character because the accent and base
	 * characters’ charstrings each already end with their own endchar commands.
	 *
	 * The use of this command saves space in a Type 1 font program, but its use
	 * is restricted to those characters whose parts are defined in the Adobe
	 * StandardEncoding vector. In situations where use of the seac command is
	 * not possible, use of Subrs subroutines is a more general means for
	 * creating accented characters.
	 */
	private seac(asb: number, adx: number, ady: number, bchar: number, achar: number): void {}

	/**
	 * sets the left sidebearing point to (sbx, sby) and sets the character width
	 * vector to (wx, wy) in character space. This command also sets the current
	 * point to (sbx, sby), but does not place the point in the character path.
	 * Use rmoveto for the first point in the path. The name sbw stands for
	 * sidebearing and width; the x and y components of both the left sidebearing
	 * and width must be specified. If the y components of both the left
	 * sidebearing and the width are 0, then the hsbw command should be used.
	 * Either sbw or hsbw must be used once as the first command in a character
	 * outline definition. It must be used only once.
	 */
	private sbw(sbx: number, sby: number, wx: number, wy: number): void {}

	/**
	 * closepath closes a subpath. Adobe strongly recommends that all character
	 * subpaths end with a closepath command, otherwise when an outline is
	 * stroked (by setting PaintType equal to 2) you may get unexpected behavior
	 * where lines join. Note that, unlike the closepath command in the
	 * PostScript language, this command does not reposition the current point.
	 * Any subsequent rmoveto must be relative to the current point in force
	 * before the Type 1 font format closepath command was given.
	 *
	 * Make sure that any subpath section formed by the closepath command
	 * intended to be zero length, is zero length. If not, the closepath command
	 * may cause a “spike” or “hangnail” (if the subpath doubles back onto
	 * itself) with unexpected results.
	 */
	private closepath(): void {
		if (!this._path.contours.length)
			return;

		this._path.closePath();
	}

	/**
	 * Appends a horizontal line of length `dx` to the current point. Equivalent
	 * to:
	 *
	 * ```cff2
	 * dx 0 rlineto
	 * ```
	 */
	private hlineto(dx: number): void;

	/**
	 * Appends a horizontal line of length `dx1` to the current point. Subsequent
	 * argument pairs are interpreted as alternating values of `dy` and `dx`, for
	 * which additional `lineto` operators draw alternating vertical and
	 * horizontal lines.
	 */
	private hlineto(dx1: number, ...dya_dxb: number[]): void

	/**
	 * Appends a horizontal line of length `dx1` to the current point. Remaining
	 * arguments are interpreted as alternating vertical and horizontal lines.
	 */
	private hlineto(...dxa_dyb: number[]): void;

	private hlineto(...args: number[]): void {
		if (args.length === 1) {
			const [dx] = args;
			return this.rlineto(dx, 0);
		}

		for (let i = 0; i < args.length; i += 2) {
			const dx = args[i], dy = args[i+1];

			this.rlineto(dx, 0);

			if (dy != null)
				this.rlineto(0, dy);
		}
	}

	/**
	 * for horizontal moveto. Equivalent to:
	 *
	 * ```cff2
	 * dx 0 rmoveto
	 * ```
	 */
	private hmoveto(dx: number): void {
		this.rmoveto(dx, 0);
	}

	/**
	 * for horizontal-vertical curveto. Equivalent to:
	 *
	 * ```cff2
	 * dx1 0 dx2 dy2 0 dy3 rrcurveto
	 * ```
	 *
	 * This command eliminates two arguments from an rrcurveto call
	 * when the first Bézier tangent is horizontal and the second Bézier tangent
	 * is vertical.
	 */
	private hvcurveto(dx1: number, dx2: number, dy2: number, dy3: number): void;

	/**
	 * Appends one or more Bézier curves to the current point. The tangent for
	 * the first Bézier must be horizontal, and the second must be vertical
	 * (except as noted below).
	 *
	 * If there is a multiple of four arguments, the curve starts horizontal and
	 * ends vertical. Note that the curves alternate between start horizontal,
	 * end vertical, and start vertical, and end horizontal. The last curve (the
	 * odd argument case) need not end horizontal/vertical.
	 */
	private hvcurveto(
		dx1: number, dx2: number, dy2: number, dy3: number,
		...dya_dxb_dyb_dxc__dxd_dxe_dye_dyf__dxf: number[]
	): void;

	/**
	 * @param args
	 *      dx1 dx2 dy2 dy3 {dya dxb dyb dxc   dxd dxe dye dyf}*  dxf?
	 * OR: {dxa dxb dyb dyc  dyd dxe dye dxf}+ dyf?
	 */
	private hvcurveto(...args: number[]): void {
		let i = 0;
		while (args.length) {
			let dx1 = 0, dy1 = 0,
				dx2 = 0, dy2 = 0,
				dx3 = 0, dy3 = 0;

			if (i++ % 2 === 0)
				[dx1, dx2, dy2, dy3] = args.splice(0, 4);
			else
				[dy1, dx2, dy2, dx3] = args.splice(0, 4);

			if (args.length === 1) {
				// _After_ an even number of iterations -- note the i++ above
				if (i % 2 === 0)
					dy3 = args.pop()!;
				else
					dx3 = args.pop()!;
			}

			// console.log(`  rrcurveto(${dx1},${dy1}, ${dx2},${dy2}, ${dx3},${dy3})`);
			this.rrcurveto(dx1, dy1, dx2, dy2, dx3, dy3);
		}
	}

	/**
    * (relative `lineto`) appends a straight line segment to the current path
    * (see Section 4.4, "Path Construction"), starting from the current point
    * and extending `dx` user space units horizontally and `dy` units
    * vertically. That is, the operands `dx` and `dy` are interpreted as
    * relative displacements from the current point rather than as absolute
    * coordinates. In all other respects, the behavior of `rlineto` is identical
    * to that of `lineto`.
	 *
	 * If the current point is undefined because the current path is empty, a
    * `nocurrentpoint` error occurs.
	 */
	private rlineto(dx: number, dy: number): void;

	/**
	 * Appends a line from the current point to a position at the relative
	 * coordinates `dx`, `dy`. Additional `rlineto` operations are performed for
	 * all subsequent argument pairs. The number of lines is determined from the
	 * number of arguments on the stack.
	 */
	private rlineto(...dx_dy: number[]): void;

	private rlineto(...args: number[]): void {
		if (args.length % 2) {
			console.error(`Expected args.length to be divisible by two, but received ${args.length}`);
			return;
		}

		for (let i = 0; i < args.length; i += 2) {
			const [x0, y0] = this._currentPoint;

			let [dx, dy] = args.slice(i, i+2);
			const x1 = x0+dx, y1 = y0+dy;

			this.lineto(x1, y1);
		}
	}

	/**
	 * @param args {dxa dya dxb dyb dxc dyc}+ dxd dyd
	 *
	 * Is equivalent to one `rrcurveto` for each set of six arguments
	 * `dxa`...`dyc`, followed by exactly one `rlineto` using the `dxd`, `dyd`
	 * arguments. The number of curves is determined from the count on the
	 * argument stack.
	 */
	private rcurveline(...args: number[]): void {
		while (args.length) {
			if (args.length > 2) {
				const [dxa, dya, dxb, dyb, dxc, dyc] = args.splice(0, 6);
				// console.log(`  rrcurveto(${dxa}, ${dya}, ${dxb}, ${dyb}, ${dxc}, ${dyc})`);
				this.rrcurveto(dxa, dya, dxb, dyb, dxc, dyc);
			}
			else {
				const [dx, dy] = args.splice(0, 2);
				// console.log(`  rlineto(${dx}, ${dy})`);
				this.rlineto(dx, dy);
			}
		}
	}

	/**
	 * @param args {dxa dya}+ dxb dyb dxc dyc dxd dyd
	 *
	 * Is equivalent to one `rlineto` for each pair of arguments beyond the six
	 * arguments `dxb`...`dyd` needed for the one `rrcurveto` command. The number
	 * of lines is determined from the count of items on the argument stack.
	 */
	private rlinecurve(...args: number[]): void {
		const rlinetoArgsLength = args.length - 6;
		const rlinetoArgs = args.splice(0, rlinetoArgsLength);

		// console.log(`  rlineto(${rlinetoArgs.join(", ")})`);
		this.rlineto(...rlinetoArgs);
		// console.log(`  rrcurveto(${args.join(", ")})`);
		this.rrcurveto(...args);
	}

	/**
	 * @param args dx1? {dya dxb dyb dyc}+
	 *
	 * Appends one or more curves to the current point. If the argument count is
	 * a multiple of four, the curve starts and ends vertical. If the argument
	 * count is odd, the first curve does not begin with a vertical tangent.
	 */
	private vvcurveto(...args: number[]): void {
		const dx1 = (args.length % 4)
			? args.shift()!
			: 0;

		const [dya, dxb, dyb, dyc] = args.splice(0, 4);
		// console.log(`  rrcurveto(${dx1}, ${dya}, ${dxb}, ${dyb}, 0, ${dyc})`);
		this.rrcurveto(dx1, dya, dxb, dyb, 0, dyc);

		while (args.length) {
			const [dya, dxb, dyb, dyc] = args.splice(0, 4);
			// console.log(`  rrcurveto(0, ${dya}, ${dxb}, ${dyb}, 0, ${dyc})`);
			this.rrcurveto(0, dya, dxb, dyb, 0, dyc);
		}
	}

	/**
	 * @param args dy1? {dxa dxb dyb dxc}+
	 *
	 * Appends one or more Bézier curves, as described by the `dxa`...`dxc` set
	 * of arguments, to the current point. For each curve, if there are 4
	 * arguments, the curve starts and ends horizontal. The first curve need not
	 * start horizontal (the odd argument case). Note the argument order for the
	 * odd argument case.
	 */
	private hhcurveto(...args: number[]): void {
		const dy1 = (args.length % 4)
			? args.shift()!
			: 0;

		const [dxa, dxb, dyb, dxc] = args.splice(0, 4);
		// console.log(`  rrcurveto(${dxa}, ${dy1}, ${dxb}, ${dyb}, ${dxc}, 0)`);
		this.rrcurveto(dxa, dy1, dxb, dyb, dxc, 0);

		while (args.length) {
			const [dxa, dxb, dyb, dxc] = args.splice(0, 4);
			// console.log(`  rrcurveto(${dxa}, 0, ${dxb}, ${dyb}, ${dxc}, 0)`);
			this.rrcurveto(dxa, 0, dxb, dyb, dxc, 0);
		}
	}

	/**
	 * appends a straight line segment to the current path (see Section 4.4,
	 * "Path Construction"), starting from the current point and extending to the
	 * coordinates (x,y) in user space. The endpoint (x,y) becomes the new
	 * current point.
	 *
	 * If the current point is undefined because the current path is empty, a
	 * `nocurrentpoint` error occurs.
	 */
	private lineto(x: number, y: number): void {
		if (!this._path) {
			console.error("nocurrentpoint");
			return;
		}

		this._path.lineTo(x, y);
		this._currentPoint = [x, y];
	}

	/**
	 * (relative `moveto`) starts a new subpath of the current path (see Section
	 * 4.4, "Path Construction") by displacing the coordinates of the current
	 * point `dx` user space units horizontally and `dy` units vertically,
	 * without connecting it to the previous current point. That is, the operands
	 * `dx` and `dy` are interpreted as relative displacements from the current
	 * point rather than as absolute coordinates. In all other respects, the
	 * behavior of rmoveto is identical to that of moveto.
	 *
	 * If the current point is undefined because the current path is empty, a
	 * `nocurrentpoint` error occurs.
	 */
	private rmoveto(dx: number, dy: number): void {
		const [x0, y0] = this._currentPoint;
		const x1 = x0+dx, y1 = y0+dy;

		// console.log(`  moveto(${x1}, ${y1})`);
		this.moveto(x1, y1);
	}

	/**
	 * starts a new subpath of the current path (see Section 4.4, "Path
	 * Construction") by setting the current point in the graphics state to the
	 * coordinates (x, y) in user space. No new line segments are added to the
	 * current path.
	 *
	 * If the previous path operation in the current path was `moveto` or
	 * `rmoveto`, that point is deleted from the current path and the new
	 * `moveto` point replaces it.
	 */
	private moveto(x: number, y: number): void {
		this._path.moveTo(x, y);
		this._currentPoint = [x, y];
	}

	/**
	 * for relative rcurveto. Whereas the arguments to the rcurveto operator in
	 * the PostScript language are all relative to the current point, the
	 * arguments to rrcurveto are relative to each other. Equivalent to:
	 *
	 * ```cff2
	 * dx1 dy1 (dx1+dx2) (dy1+dy2) (dx1+dx2+dx3) (dy1+dy2+dy3) rcurveto
	 * ```
	 */
	private rrcurveto(
		dx1: number, dy1: number,
		dx2: number, dy2: number,
		dx3: number, dy3: number,
	): void;

	/**
	 * Appends a Bezier curve to the current point. For each subsequent set of
	 * six arguments, an additional curve is appended to the current point.
	 */
	private rrcurveto(...dx1_dy1_dx2_dy2_dx2_dy3: number[]): void;

	private rrcurveto(...args: number[]): void {
		if (args.length % 6) {
			console.error(`Expected args.length to be divisible by six, but received ${args.length}`);
			return;
		}

		for (let i = 0; i < args.length; i += 6) {
			const [dx1, dy1, dx2, dy2, dx3, dy3] = args.slice(i, i+6);
			// console.log(`  rcurveto(${dx1}, ${dy1}, ${dx1+dx2}, ${dy1+dy2}, ${dx1+dx2+dx3}, ${dy1+dy2+dy3})`);
			this.rcurveto(dx1, dy1, (dx1+dx2), (dy1+dy2), (dx1+dx2+dx3), (dy1+dy2+dy3));
		}
	}

	/**
	 * (relative curveto) adds a Bezier cubic section to the current path in the
	 * same manner as `curveto`. However, the three number pairs are interpreted as
	 * displacements relative to the current point (x0, y0) rather than as
	 * absolute coordinates. That is, rcurveto constructs a curve from (x0, y0)
	 * to (x0+dx3, y0+dy3), using (x0+dx1, y0+dy1) and (x0+dx2, y0+dy2) as Bezier
	 * control points. See the description of `curveto` for complete information.
	 */
	private rcurveto(
		dx1: number, dy1: number,
		dx2: number, dy2: number,
		dx3: number, dy3: number,
	): void {
		const [x0, y0] = this._currentPoint;

		const x1 = x0+dx1, y1 = y0+dy1;
		const x2 = x0+dx2, y2 = y0+dy2;
		const x3 = x0+dx3, y3 = y0+dy3;
		// console.log(`  curveto(${x1},${y1}, ${x2},${y2}, ${x3},${y3})`);
		this.curveto(x1, y1, x2, y2, x3, y3);
	}

	/**
	 * appends a section of a cubic Bézier curve to the current path between the
	 * current point (x0,y0) and the endpoint (x3,y3), using (x1,y1) and (x2,y2)
	 * as the Bézier control points. The endpoint (x3,y3) becomes the new current
	 * point. If the current point is undefined because the current path is
	 * empty, a `nocurrentpoint` error occurs.
	 */
	private curveto(
		x1: number, y1: number,
		x2: number, y2: number,
		x3: number, y3: number,
	): void {
		if (!this._path) {
			console.error("nocurrentpoint");
			return;
		}

		this._path.bezierCurveTo(x1, y1, x2, y2, x3, y3);
		this._currentPoint = [x3, y3];
	}

	/**
	 * for vertical-horizontal curveto. Equivalent to:
	 *
	 * ```cff2
	 * 0 dy1 dx2 dy2 dx3 0 rrcurveto
	 * ```
	 *
	 * This command eliminates two arguments from an rrcurveto call
	 * when the first Bézier tangent is vertical and the second Bézier tangent is
	 * horizontal.
	 */
	private vhcurveto(dy1: number, dx2: number, dy2: number, dx3: number): void;

	/**
	 * Appends one or more Bézier curves to the current point, where the first
	 * tangent is vertical and the second tangent is horizontal. This command is
	 * the complement of hvcurveto; see the description of hvcurveto for more
	 * information.
	 */
	private vhcurveto(
		dy1: number, dx2: number, dy2: number, dx3: number,
		...rest: number[]
	): void;

	/**
	 * @param args
	 *      dy1 dx2 dy2 dx3 {dxa dxb dyb dyc   dyd dxe dye dxf}* dyf?
	 * OR: {dya dxb dyb dxc  dxd dxe dye dyf}+ dxf?
	 */
	private vhcurveto(...args: number[]): void {
		let i = 0;
		while (args.length) {
			let dx1 = 0, dy1 = 0,
				dx2 = 0, dy2 = 0,
				dx3 = 0, dy3 = 0;

			if (i++ % 2 === 0)
				[dy1, dx2, dy2, dx3] = args.splice(0, 4);
			else
				[dx1, dx2, dy2, dy3] = args.splice(0, 4);

			if (args.length === 1) {
				// _After_ an even number of iterations -- note the i++ above
				if (i % 2 === 0)
					dx3 = args.pop()!;
				else
					dy3 = args.pop()!;
			}

			// console.log(`  rrcurveto(${dx1},${dy1}, ${dx2},${dy2}, ${dx3},${dy3})`);
			this.rrcurveto(dx1, dy1, dx2, dy2, dx3, dy3);
		}
	}

	/**
	 * for vertical `lineto`. Equivalent to:
	 *
	 * ```cff2
	 * 0 dy rlineto
	 * ```
	 */
	private vlineto(dy: number): void;

	/**
	 * Appends a vertical line of length `dy1` to the current point. Subsequent
	 * argument pairs are interpreted as alternating values of `dx` and `dy`, for
	 * which additional `lineto` operators draw alternating horizontal and
	 * vertical lines.
	 */
	private vlineto(dy1: number, ...dxa_dyb: number[]): void;

	/**
	 * Arguments are interpreted as alternating vertical and horizontal lines.
	 */
	private vlineto(...dya_dxb: number[]): void;

	private vlineto(...args: number[]): void {
		if (args.length === 1) {
			const [dy] = args;
			return this.rlineto(0, dy);
		}

		for (let i = 0; i < args.length; i += 2) {
			const dy = args[i], dx = args[i+1];

			this.rlineto(0, dy);

			if (dx != null)
				this.rlineto(dx, 0);
		}
	}

	/**
	 * for vertical `moveto`. This is equivalent to:
	 *
	 * ```cff2
	 * 0 dy rmoveto
	 * ```
	 */
	private vmoveto(dy: number): void {
		this.rmoveto(0, dy);
	}

	/**
	 * brackets an outline section for the dots in letters such as “i”,“ j”, and
	 * “!”. This is a hint command that indicates that a section of a charstring
	 * should be understood as describing such a feature, rather than as part of
	 * the main outline. For more details, see section 8.2, “Dot Sections,” in
	 * Chapter 8, “Using Subroutines.”
	 */
	private dotsection(): void {}

	/**
	 * behaves like `div` in the PostScript language.
	 */
	private div(num1: number, num2: number): void {}

	/**
	 * is a mechanism used by Type 1 BuildChar to make calls on the PostScript
	 * interpreter. Arguments argn through arg1 are pushed onto the PostScript
	 * interpreter operand stack, and the PostScript language procedure in the
	 * othersubr# position in the OtherSubrs array in the Private dictionary (or
	 * a built-in function equivalent to this procedure) is executed. Note that
	 * the argument order will be reversed when pushed onto the PostScript
	 * interpreter operand stack. After the arguments are pushed onto the
	 * PostScript interpreter operand stack, the PostScript interpreter performs
	 * a begin operation on systemdict followed by a begin operation on the font
	 * dictionary prior to executing the OtherSubrs entry. When the OtherSubrs
	 * entry completes its execution, the PostScript interpreter performs two end
	 * operations prior to returning to Type 1 BuildChar charstring execution.
	 * Use pop commands to retrieve results from the PostScript operand stack
	 * back to the Type 1 BuildChar operand stack. See Chapter 8, “Using
	 * Subroutines,” for details on using callothersubr.
	 */
	private callothersubr(othersubr: number, n: number, ...args: number[]): void {}

	/**
	 * calls a charstring subroutine with index subr# from the Subrs array in the
	 * Private dictionary. Each element of the Subrs array is a charstring
	 * encoded and encrypted like any other charstring. Arguments pushed on the
	 * Type 1 BuildChar operand stack prior to calling the subroutine, and
	 * results pushed on this stack by the subroutine, act according to the
	 * manner in which the subroutine is coded. These subroutines are generally
	 * used to encode sequences of path commands that are repeated throughout the
	 * font program, for example, serif outline sequences. Subroutine calls may
	 * be nested 10 deep. See Chapter 8, “Using Subroutines,” for other uses for
	 * subroutines, such as changing hints.
	 */
	private callsubr(index: number): void {
		// console.log(`callsubr(${index} <${index + this._subrs.bias}>)`);
		const subrStack = this._subrs.get(index);
		if (!subrStack) return;

		this._stack.push(...subrStack);
	}

	/**
	 * Operates in the same manner as `callsubr` except that it calls a global
	 * subroutine.
	 */
	private callgsubr(index: number): void {
		// console.log(`callgsubr(${index} <${index + this._globalSubrs.bias}>)`);
		const subrStack = this._globalSubrs.get(index);
		if (!subrStack) return;

		this._stack.push(...subrStack);
	}

	/**
	 * removes a number from the top of the PostScript interpreter operand stack
	 * and pushes that number onto the Type 1 BuildChar operand stack. This
	 * command is used only to retrieve a result from an OtherSubrs procedure.
	 * For more details, see Chapter 8, “Using Subroutines.”
	 */
	private pop(): void {}

	/**
	 * returns from a Subrs array charstring subroutine (that had been called
	 * with a callsubr command) and continues execution in the calling
	 * charstring.
	 */
	private return(...args: number[]): void {
		while (args.length)
			this._stack.push(args.pop()!);
	}

	/**
	 * sets the current point in the Type 1 font format BuildChar to (x, y) in
	 * absolute character space coordinates without performing a charstring
	 * moveto command. This establishes the current point for a subsequent
	 * relative path building command. The setcurrentpoint command is used only
	 * in conjunction with results from OtherSubrs procedures.
	 */
	private setcurrentpoint(x: number, y: number): void {}

	/**
	 * @param args dx1 dx2 dy2 dx3 dx4 dx5 dx6
	 *
	 * Causes the two curves described by the arguments `dx1`...`dx6` to be
	 * rendered as a straight line when the flex depth is less than 0.5 (that is,
	 * fd is 50) device pixels, and as curved lines when the flex depth is
	 * greater than or equal to 0.5 device pixels.
	 *
	 * hflex is used when the following are all true:
	 *  - The starting and ending points, first and last control points have the
	 *    same y value.
	 *  - The joining point and the neighbor control points have the same y
	 *    value.
	 *  - The flex depth is 50.
	 */
	private hflex(
		dx1: number,
		dx2: number, dy2: number,
		dx3: number,
		dx4: number,
		dx5: number,
		dx6: number,
	): void {
		this.flex(
			dx1, dy2, dx2, dy2, dx3, dy2,
			dx4, dy2, dx5, dy2, dx6, dy2,
			50,
		);
	}

	/**
	 * @param args dx1 dy1 dx2 dy2 dx3 dy3 dx4 dy4 dx5 dy5 dx6 dy6 fd
	 *
	 * Causes two Bézier curves, as described by the arguments (as shown in
	 * Figure 2 below), to be rendered as a straight line when the flex depth is
	 * less than fd/100 device pixels, and as curved lines when the flex depth is
	 * greater than or equal to fd/100 device pixels. The flex depth for a
	 * horizontal curve, as shown in Figure 2, is the distance from the join
	 * point to the line connecting the start and end points on the curve. If the
	 * curve is not exactly horizontal or vertical, it must be determined whether
	 * the curve is more horizontal or vertical by the method described in the
	 * flex1 description, below, and as illustrated in Figure 3.
	 *
	 * > Note: In cases where some of the points have the same x or y coordinate
	 * > as other points in the curves, arguments may be omitted by using one of
	 * > the following forms of the flex operator: hflex, hflex1, or flex1.
	 *
	 * @see [Figure 2](https://learn.microsoft.com/en-us/typography/opentype/spec/cff2charstr#Figure2)
	 * @see [Figure 3](https://learn.microsoft.com/en-us/typography/opentype/spec/cff2charstr#Figure3)
	 */
	private flex(
		dx1: number, dy1: number, dx2: number, dy2: number, dx3: number, dy3: number,
		dx4: number, dy4: number, dx5: number, dy5: number, dx6: number, dy6: number,
		fd: number,
	): void {
		// TODO: Implement the actual "flex" functionality
		// FIXME: Really not sure what I'm doing wrong here, but this is not
		//        working as expected at all
		this.rrcurveto(
			dx1, dy1, dx2, dy2, dx3, dy3,
			dx4, dy4, dx5, dy5, dx6, dy6,
		);
	}

	/**
	 * @param args dx1 dy1 dx2 dy2 dx3 dx4 dx5 dy5 dx6
	 *
	 * Causes the two curves described by the arguments to be rendered as a
	 * straight line when the flex depth is less than 0.5 device pixels, and as
	 * curved lines when the flex depth is greater than or equal to 0.5 device
	 * pixels.
	 *
	 * hflex1 is used if the conditions for hflex are not met but all of the
	 * following are true:
	 *  - The starting and ending points have the same y value.
	 *  - The joining point and the neighbor control points have the same y
	 *    value.
	 *  - The flex depth is 50.
	 */
	private hflex1(
		dx1: number, dy1: number, dx2: number, dy2: number, dx3: number,
		dx4: number,              dx5: number, dy5: number, dx6: number,
	): void {
		this.flex(
			dx1, dy1, dx2, dy2, dx3, dy2,
			dx4, dy2, dx5, dy5, dx6, dy1,
			50,
		);
	}

	/**
	 * @param args dx1 dy1 dx2 dy2 dx3 dy3 dx4 dy4 dx5 dy5 d6
	 *
	 * Causes the two curves described by the arguments to be rendered as a
	 * straight line when the flex depth is less than 0.5 device pixels, and as
	 * curved lines when the flex depth is greater than or equal to 0.5 device
	 * pixels.
	 *
	 * The `d6` argument will be either a `dx` or `dy` value, depending on the curve
	 * (see Figure 3). To determine the correct value, compute the distance from
	 * the starting point (x, y), the first point of the first curve, to the last
	 * flex control point (dx5, dy5) by summing all the arguments except d6; call
	 * this (dx, dy). If abs(dx) > abs(dy), then the last point’s x-value is
	 * given by d6, and its y-value is equal to y. Otherwise, the last point’s
	 * x-value is equal to x and its y-value is given by d6.
	 *
	 * flex1 is used if the conditions for hflex and hflex1 are not met but all
	 * of the following are true:
	 *  - The starting and ending points have the same x or y value.
	 *  - The flex depth is 50.
	 */
	private flex1(
		dx1: number, dy1: number, dx2: number, dy2: number, dx3: number, dy3: number,
		dx4: number, dy4: number, dx5: number, dy5: number, d6: number,
	): void {
		const [x, y] = this._currentPoint;
		const dx = dx1 + dx2 + dx3 + dx4 + dx5;
		const dy = dy1 + dy2 + dy3 + dy4 + dy5;

		const [dx6, dy6] = Math.abs(dx) > Math.abs(dy) ? [d6, dy1] : [dx1, d6];

		this.flex(
			dx1, dy1, dx2, dy2, dx3, dy3,
			dx4, dy4, dx5, dy5, dx6, dy6,
			50,
		);
	}


	// TODO: Hinting
	/**
	 * declares the horizontal range of a vertical stem zone (see the following
	 * section for more information about vertical stem hints) between the x
	 * coordinates x and x+dx, where x is relative to the x coordinate of the
	 * left sidebearing point. Vertical stem zones within a set of stem hints for
	 * a single character may not overlap other vertical stem zones. Use hint
	 * replacement to avoid stem hint overlap. For more details on hint
	 * replacement, see section 8.1, “Changing Hints Within a Character,” in
	 * Chapter 8, “Using Subroutines.”
	 */
	private vstem(x: number, dx: number): void {}

	/**
	 * declares the horizontal ranges of three vertical stem zones between the x
	 * coordinates x0 and x0 + dx0, x1 and x1 + dx1, and x2 and x2 + dx2, where
	 * x0, x1 and x2 are all relative to the x coordinate of the left sidebearing
	 * point. The vstem3 command sorts these zones by the x values to obtain the
	 * leftmost, middle and rightmost zones, called xmin, xmid and xmax
	 * respectively. The corresponding dx values are called dxmin, dxmid and
	 * dxmax. These stems and the counters between them will all be controlled.
	 * These coordinates must obey certain restrictions described as follows:
	 *
	 * - dxmin = dxmax
	 * - The distance from xmin + dxmin/2 to xmid + dxmid/2 must equal the
	 *   distance from xmid + dxmid/2 to xmax + dxmax/2. In other words, the
	 *   distance from the center of the left stem to the center of the middle
	 *   stem must be the same as the distance from the center of the middle stem
	 *   to the center of the right stem.
	 *
	 * If a charstring uses a vstem3 command in the hints for a character, the
	 * charstring must not use vstem commands and it must use the same vstem3
	 * command consistently if hint replacement is performed.
	 *
	 * The vstem3 command is especially suited for controlling the stems and
	 * counters of characters such as a lower case “m.”
	 */
	private vstem3(
		x0: number, dx0: number,
		x1: number, dx1: number,
		x2: number, dx2: number,
	): void {}

	/**
	 * declares the vertical range of a horizontal stem zone (see the following
	 * section for more information about horizontal stem hints) between the y
	 * coordinates y and y+dy, where y is relative to the y coordinate of the
	 * left sidebearing point. Horizontal stem zones within a set of stem hints
	 * for a single character may not overlap other horizontal stem zones. Use
	 * hint replacement to avoid stem hint overlaps. For more details on hint
	 * replacement, see section 8.1, “Changing Hints Within a Character,” in
	 * Chapter 8, “Using Subroutines.”
	 */
	private hstem(y: number, dy: number): void {}

	/**
	 * declares the vertical ranges of three horizontal stem zones between the y
	 * coordinates y0 and y0 + dy0, y1 and y1 + dy1, and between y2 and y2 + dy2,
	 * where y0, y1 and y2 are all relative to the y coordinate of the left
	 * sidebearing point. The hstem3 command sorts these zones by the y values to
	 * obtain the lowest, middle and highest zones, called ymin, ymid and ymax
	 * respectively. The corresponding dy values are called dymin, dymid and
	 * dymax. These stems and the counters between them will all be controlled.
	 * These coordinates must obey certain restrictions:
	 *
	 * - dymin = dymax
	 * - The distance from ymin + dymin/2 to ymid + dymid/2 must equal the
	 *   distance from ymid + dymid/2 to ymax + dymax/2. In other words, the
	 *   distance from the center of the bottom stem to the center of the middle
	 *   stem must be the same as the distance from the center of the middle stem
	 *   to the center of the top stem.
	 *
	 * If a charstring uses an hstem3 command in the hints for a character, the
	 * charstring must not use hstem commands and it must use the same hstem3
	 * command consistently if hint replacement is performed.
	 *
	 * The hstem3 command is especially suited for controlling the stems and
	 * counters of symbols with three horizontally oriented features with equal
	 * vertical widths and with equal white space between these features, such as
	 * the mathematical equivalence symbol or the division symbol.
	 */
	private hstem3(
		y0: number, dy0: number,
		y1: number, dy1: number,
		y2: number, dy2: number,
	): void {}

	private hstemhm(...args: number[]): void {}
	private vstemhm(...args: number[]): void {}
	private cntrmask(...args: number[]): void {}
	private hintmask(...args: number[]): void {}
}
