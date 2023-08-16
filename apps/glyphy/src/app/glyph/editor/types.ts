import { ThemeService } from "@electric/components";
import { Const } from "@electric/utils";

import { Matrix, vec2 } from "../../math";
import { Point } from "../path";

export type PointKey = "coords" | "handle_in" | "handle_out";
export type HandleKey = Exclude<PointKey, "coords">;

export class EditorPoint extends Point {
	readonly contourIndex: number;
	readonly pointIndex: number;
	readonly id: number;

	active?: boolean;
	activeKey?: "coords" | "handle_in" | "handle_out";

	constructor (ci: number, pi: number, point: Const<Point>) {
		super(point.x, point.y, point.smooth, point.hidden);

		this.handle_in = point.handle_in;
		this.handle_out = point.handle_out;

		this.contourIndex = ci;
		this.pointIndex = pi;

		this.id = (ci & 0x00FF) | ((pi & 0x00FF) << 16);
	}

	getStyle(theme: ThemeService) {
		const shape = this.smooth
			? (!this.handle_in || !this.handle_out
				? "triangle"
				: "circle")
			: "box";

		let radius = this.smooth ? 4 : 3.5;
		let strokeWidth = 1;

		// TODO: Create a theme color for this
		let fill = "#99C4FF80";
		if (this.pointIndex === 0)
			fill = theme.getHex("warning", 800, 0.5)!;
		else if (this.smooth)
			fill = theme.getHex("accent", 700, 0.5)!;

		let stroke = "#99C4FF";
		if (this.pointIndex === 0)
			stroke = theme.getHex("warning", 800)!;
		else if (this.smooth)
			stroke = theme.getHex("accent", 800)!;

		if (this.active && this.activeKey === "coords") {
			radius = 5.5;
			strokeWidth = 2;
		}

		let rotation = Matrix.Identity;
		if (shape === "triangle") {
			// Rotate to point the X-axis at the lone handle
			const handle = (this.handle_in ?? this.handle_out)!;
			const { x: m11, y: m12 } = vec2.sub(handle, this.coords).normalize();
			const m21 = m12;
			const m22 = -m11;

			rotation = new Matrix(
				m11, m12, 0,
				m21, m22, 0,
				  0,   0, 1,
			);
		}

		return {
			shape,
			radius,
			fill,
			rotation,
			stroke,
			strokeWidth,
		} as const;
	}

	override clone(): EditorPoint {
		const result = new EditorPoint(
			this.contourIndex,
			this.pointIndex,
			super.clone(),
		);
		result.active = this.active;
		result.activeKey = this.activeKey;

		return result;
	}
}
