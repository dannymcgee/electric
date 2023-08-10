import { Directive, Input } from "@angular/core";

import { Matrix } from "../math";
import { BaseRenderer } from "./base.renderer";
import { RenderElement, RENDER_ELEMENT } from "./render.types";

@Directive({
	selector: "g-line",
	providers: [{
		provide: RENDER_ELEMENT,
		useExisting: LineRenderer,
	}],
})
export class LineRenderer extends BaseRenderer implements RenderElement {
	@Input() x1 = 0;
	@Input() x2 = 0;

	@Input() y1 = 0;
	@Input() y2 = 0;

	onDraw(ctx: CanvasRenderingContext2D): void {
		console.log("LineRenderer:", ctx.getTransform());

		if (!this.stroke || !this.strokeWidth)
			return;

		if (this.transform !== Matrix.Identity)
			ctx.setTransform(this.transform.toDomMatrix());

		ctx.beginPath();
		ctx.moveTo(
			this.transformX(this.x1),
			this.transformY(this.y1),
		);
		ctx.lineTo(
			this.transformX(this.x2),
			this.transformY(this.y2),
		);

		ctx.resetTransform();

		ctx.strokeStyle = this.stroke;
		ctx.lineWidth = this.strokeWidth * devicePixelRatio;
		ctx.stroke();
	}
}
