import { Directive, Input } from "@angular/core";

import { DEG2RAD, Matrix, vec2 } from "../math";
import { BaseRenderer } from "./base.renderer";
import { RenderElement, RENDER_ELEMENT } from "./render.types";

export type PointShape
	= "circle"
	| "box"
	| "diamond"
	| "triangle";

const SQRT_PI = Math.sqrt(Math.PI);
const SQRT_4PI = Math.sqrt(4 * Math.PI);
const TWO_TIMES_4TH_ROOT_3 = 2 * Math.pow(3, 0.25);
const SIN_120_DEG = Math.sin(120 * DEG2RAD);
const COS_120_DEG = Math.cos(120 * DEG2RAD);

@Directive({
	selector: "g-point",
	providers: [{
		provide: RENDER_ELEMENT,
		useExisting: PointRenderer,
	}],
	standalone: false,
})
export class PointRenderer extends BaseRenderer implements RenderElement {
	@Input() shape: PointShape = "circle";
	@Input() cx = 0;
	@Input() cy = 0;
	@Input() r = 0;
	@Input() rotation = Matrix.Identity;

	onDraw(ctx: CanvasRenderingContext2D): void {
		if (!this.r)
			return;

		let { x: cx, y: cy } = this.transform.transformPoint(this.cx, this.cy);

		cx *= devicePixelRatio;
		cy *= devicePixelRatio
		const r = this.r * devicePixelRatio;

		ctx.beginPath();

		if (this.shape === "circle") {
			ctx.arc(cx, cy, r, 0, 2*Math.PI);
		}
		else if (this.shape === "triangle") {
			ctx.setTransform(Matrix.concat(
				Matrix.translate(-cx, -cy),
				Matrix.scale(1, -1),
				this.rotation,
				Matrix.scale(1, -1),
				Matrix.translate(cx, cy),
			).toDomMatrix());

			// We want an equilateral triangle that's roughly the same visual size
			// as the equivalent circle. I asked ChatGPT for a formula to derive
			// the circumradius R of an equilateral triangle with the same area as
			// a circle with radius r. It gave me 3 or 4 different formulas, all of
			// which were incorrect, but this one is a pretty good visual match,
			// so this is what we're going with.
			const R = (r * SQRT_4PI) / TWO_TIMES_4TH_ROOT_3;

			const center = vec2(cx, cy);
			const p1 = vec2.add(center, vec2(R, 0));
			const p2 = vec2.add(center, vec2.mul(vec2(COS_120_DEG, -SIN_120_DEG), R));
			const p3 = vec2.add(center, vec2.mul(vec2(COS_120_DEG, SIN_120_DEG), R));

			ctx.moveTo(p1.x, p1.y);
			ctx.lineTo(p2.x, p2.y);
			ctx.lineTo(p3.x, p3.y);
			ctx.closePath();
		}
		else {
			const size = r * SQRT_PI;

			if (this.shape === "diamond") {
				ctx.setTransform(Matrix.concat(
					Matrix.translate(-cx, -cy),
					Matrix.rotate(45),
					Matrix.translate(cx, cy),
				).toDomMatrix());
			}

			ctx.rect(
				cx - size/2,
				cy - size/2,
				size,
				size,
			);
		}

		ctx.resetTransform();

		if (this.fill) {
			ctx.fillStyle = this.fill;
			ctx.fill();
		}

		if (this.stroke && this.strokeWidth) {
			ctx.strokeStyle = this.stroke;
			ctx.lineWidth = this.strokeWidth * devicePixelRatio;
			ctx.stroke();
		}
	}
}
