import { Directive, Input } from "@angular/core";
import { Const } from "@electric/utils";

import { Path } from "../glyph";
import { Matrix } from "../math";
import { BaseRenderer } from "./base.renderer";
import { RenderElement, RENDER_ELEMENT } from "./render.types";

@Directive({
	selector: "g-path",
	providers: [{
		provide: RENDER_ELEMENT,
		useExisting: PathRenderer,
	}],
	standalone: false,
})
export class PathRenderer extends BaseRenderer implements RenderElement {
	@Input() outline?: Const<Path>;

	onDraw(ctx: CanvasRenderingContext2D): void {
		if (!this.outline) return;

		if (this.transform !== Matrix.Identity)
			ctx.setTransform(this.transform.mul(devicePixelRatio).toDomMatrix());

		ctx.beginPath();

		this.outline.replay(ctx, {
			insertClosePaths: true,
		});

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
