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
		if (!this.stroke || !this.strokeWidth)
			return;

		let [x1, x2] = [this.x1, this.x2];
		let [y1, y2] = [this.y1, this.y2];

		if (this.transform !== Matrix.Identity) {
			ctx.setTransform(this.transform.mul(devicePixelRatio).toDomMatrix());
		}
		else {
			[x1, x2] = [this.transformX(this.x1), this.transformX(this.x2)];
			[y1, y2] = [this.transformY(this.y1), this.transformY(this.y2)];
		}

		ctx.beginPath();
		ctx.moveTo(x1, y1);
		ctx.lineTo(x2, y2);

		ctx.resetTransform();

		ctx.strokeStyle = this.stroke;
		ctx.lineWidth = this.strokeWidth * devicePixelRatio;
		ctx.stroke();
	}
}
