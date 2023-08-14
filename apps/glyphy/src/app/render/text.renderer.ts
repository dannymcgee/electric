import { Directive, Input } from "@angular/core";
import { Matrix } from "../math";

import { BaseRenderer } from "./base.renderer";
import { RenderElement, RENDER_ELEMENT } from "./render.types";

export type TextAlign
	= "start"
	| "end"
	| "left"
	| "right"
	| "center";

export type TextBaseline
	= "top"
	| "hanging"
	| "middle"
	| "alphabetic"
	| "ideographic";

@Directive({
	selector: "g-text",
	providers: [{
		provide: RENDER_ELEMENT,
		useExisting: TextRenderer,
	}],
})
export class TextRenderer extends BaseRenderer implements RenderElement {
	@Input() value = "";

	@Input() x!: number;
	@Input() y!: number;

	@Input() fontFamily = "sans-serif"
	@Input() fontSize = 16;
	@Input() align: TextAlign = "center";
	@Input() baseline: TextBaseline = "alphabetic";

	onDraw(ctx: CanvasRenderingContext2D): void {
		if (!this.value) return;

		const x = this.transformX(this.x);
		const y = this.transformY(this.y);

		if (this.transform !== Matrix.Identity)
			ctx.setTransform(this.transform.toDomMatrix());

		this.setTextStyle(ctx);

		if (this.fill) {
			ctx.fillStyle = this.fill;
			ctx.fillText(this.value, x, y);
		}

		if (this.stroke && this.strokeWidth) {
			ctx.strokeStyle = this.stroke;
			ctx.lineWidth = this.strokeWidth * devicePixelRatio;
			ctx.strokeText(this.value, x, y);
		}

		ctx.resetTransform();
	}

	measure(ctx: CanvasRenderingContext2D): TextMetrics {
		if (this.transform !== Matrix.Identity)
			ctx.setTransform(this.transform.toDomMatrix());

		this.setTextStyle(ctx);

		const result = ctx.measureText(this.value);

		ctx.resetTransform();

		return result;
	}

	private setTextStyle(ctx: CanvasRenderingContext2D): void {
		ctx.font = `${this.fontSize * devicePixelRatio}px ${this.fontFamily}`;
		ctx.textAlign = this.align;
		ctx.textBaseline = this.baseline;
	}
}
