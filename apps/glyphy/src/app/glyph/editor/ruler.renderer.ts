import {
	ChangeDetectionStrategy,
	Component,
	Input,
} from "@angular/core";
import { Orientation, ThemeService } from "@electric/components";
import { Const, Option } from "@electric/utils";

import { Matrix, Rect } from "../../math";
import {
	GroupRenderer,
	PaintStyle,
	RenderElement,
	RENDER_ELEMENT,
	TextRenderer,
} from "../../render";

export interface Hash {
	value: number;
	lineColor: PaintStyle;
	textColor: PaintStyle;
}

@Component({
	selector: "g-ruler",
	templateUrl: "./ruler.renderer.html",
	providers: [{
		provide: RENDER_ELEMENT,
		useExisting: RulerRenderer,
	}],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RulerRenderer extends GroupRenderer implements RenderElement {
	@Input() orientation: Orientation = "horizontal";
	@Input() hashes: Hash[] = [];

	@Input() x = 0;
	@Input() y = 0;
	@Input() width = 0;
	@Input() height = 0;

	@Input() glyphToCanvas = Matrix.Identity;
	@Input() canvasToGlyph = Matrix.Identity;

	@Input() background?: Option<PaintStyle> = this.theme.getHex("foreground", 50);

	get top() { return this.y; }
	get right() { return this.x + this.width; }
	get bottom() { return this.y + this.height; }
	get left() { return this.x; }

	constructor (
		public theme: ThemeService,
	) {
		super();
	}

	override onDraw(ctx: CanvasRenderingContext2D): void {
		if (!this.children) return;

		const occupied: Rect[] = [];
		for (let element of this.children) {
			if (element instanceof TextRenderer) {
				// Ensure that text elements don't overlap each other, giving
				// priority to elements that are rendered first.
				const rect = element.measure(ctx);
				rect.inflate_inPlace(6 * devicePixelRatio);

				if (occupied.some(r => r.intersects(rect)))
					continue;

				occupied.push(rect);
			}

			element.onDraw(ctx);
		}
	}

	/**
	 * @returns a transform to rotate text for the vertical ruler.
	 *
	 * @param cx The x coordinate in client space
	 * @param gy The y coordinate in glyph space
	 */
	_textTransform(cx: number, gy: number): Const<Matrix> {
		const x = cx * devicePixelRatio;
		const y = this.glyphToCanvas.transformPoint(0, gy).y * devicePixelRatio;

		return Matrix.concat(
			Matrix.translate(-x, -y),
			Matrix.rotate(-90),
			Matrix.translate(x, y),
		);
	}
}
