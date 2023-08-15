import {
	ChangeDetectionStrategy,
	Component,
	Input,
} from "@angular/core";
import { Orientation, ThemeService } from "@electric/components";
import { Const, Option } from "@electric/utils";

import { Matrix, Rect, vec2 } from "../../math";
import {
	GroupRenderer,
	PaintStyle,
	RenderElement,
	RENDER_ELEMENT,
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
