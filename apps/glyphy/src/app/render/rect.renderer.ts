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

		let x!: number;
		let y!: number;
		let width!: number;
		let height!: number;

		if (this.transform !== Matrix.Identity) {
			ctx.setTransform(this.transform.mul(devicePixelRatio).toDomMatrix());
			x = this.x;
			y = this.y;
			width = this.width;
			height = this.height;
		}
		else {
			x = this.transformX(this.x);
			y = this.transformY(this.y);
			width = this.transformX(this.width);
			height = this.transformY(this.height);
		}

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
