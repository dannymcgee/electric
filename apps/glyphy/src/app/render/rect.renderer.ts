import { Directive, Input } from "@angular/core";

import { Matrix } from "../math";
import { BaseRenderer } from "./base.renderer";
import { RenderElement, RENDER_ELEMENT } from "./render.types";

@Directive({
	selector: "g-rect",
	providers: [{
		provide: RENDER_ELEMENT,
		useExisting: RectRenderer,
	}],
})
export class RectRenderer extends BaseRenderer implements RenderElement {
	@Input() x = 0;
	@Input() y = 0;
	@Input() width = 0;
	@Input() height = 0;

	onDraw(ctx: CanvasRenderingContext2D): void {
		if (!this.width || !this.height)
			return;

		if (this.transform !== Matrix.Identity)
			ctx.setTransform(this.transform.toDomMatrix());

		const x = this.transformX(this.x);
		const y = this.transformY(this.y);

		const width = this.transformX(this.width);
		const height = this.transformY(this.height);

		ctx.beginPath();
		ctx.rect(x, y, width, height);

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
