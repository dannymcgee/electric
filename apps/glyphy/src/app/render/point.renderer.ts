import { Directive, Input } from "@angular/core";

import { Matrix, vec2 } from "../math";
import { BaseRenderer } from "./base.renderer";
import { RenderElement, RENDER_ELEMENT } from "./render.types";

export type PointShape
	= "circle"
	| "box"
	| "diamond";

const SQRT_PI = Math.sqrt(Math.PI);

@Directive({
	selector: "g-point",
	providers: [{
		provide: RENDER_ELEMENT,
		useExisting: PointRenderer,
	}],
})
export class PointRenderer extends BaseRenderer implements RenderElement {
	@Input() shape: PointShape = "circle";
	@Input() cx = 0;
	@Input() cy = 0;
	@Input() r = 0;

	onDraw(ctx: CanvasRenderingContext2D): void {
		if (!this.r)
			return;

		let { x: cx, y: cy } = this.transform.transformPoint(this.cx, this.cy);

		cx *= devicePixelRatio;
		cy *= devicePixelRatio

		ctx.beginPath();

		if (this.shape === "circle") {
			ctx.arc(cx, cy, this.r*devicePixelRatio, 0, 2*Math.PI);
		}
		else {
			const size = this.r * SQRT_PI * devicePixelRatio;

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
