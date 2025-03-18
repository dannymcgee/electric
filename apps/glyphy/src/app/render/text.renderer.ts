import { Directive, Input } from "@angular/core";
import { Matrix, Rect, vec2, Vec2 } from "../math";

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
	standalone: false,
})
export class TextRenderer extends BaseRenderer implements RenderElement {
	@Input() value = "";

	@Input() x!: number;
	@Input() y!: number;

	@Input() fontFamily = "sans-serif"
	@Input() fontSize = 16;
	@Input() align: TextAlign = "center";
	@Input() baseline: TextBaseline = "alphabetic";

	private _transformedOrigin?: Vec2;
	get transformedOrigin() {
		return this._transformedOrigin ??= vec2(
			this.transformX(this.x),
			this.transformY(this.y),
		);
	}

	onDraw(ctx: CanvasRenderingContext2D): void {
		if (!this.value) return;

		const { x, y } = this.transformedOrigin;

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

		delete this._transformedOrigin;
	}

	measure(ctx: CanvasRenderingContext2D): Rect {
		this.setTextStyle(ctx);

		const metrics = ctx.measureText(this.value);

		const { x, y } = this.transformedOrigin;
		const result = new Rect(
			x - metrics.actualBoundingBoxLeft,
			y - metrics.actualBoundingBoxAscent,
			metrics.width,
			metrics.actualBoundingBoxAscent - metrics.actualBoundingBoxDescent,
		);

		result.transform_inPlace(this.transform);

		return result;
	}

	private setTextStyle(ctx: CanvasRenderingContext2D): void {
		ctx.font = `${this.fontSize * devicePixelRatio}px ${this.fontFamily}`;
		ctx.textAlign = this.align;
		ctx.textBaseline = this.baseline;
	}
}
