import { ChangeDetectionStrategy, Component, Input } from "@angular/core";
import { ThemeService, Vec2 } from "@electric/components";
import { Const, exists } from "@electric/utils";

import { FontMetrics } from "../../family";
import { IRect, Matrix, Rect } from "../../math";
import {
	GroupRenderer,
	PaintStyle,
	RenderElement,
	RENDER_ELEMENT,
} from "../../render";
import { Glyph } from "../glyph";
import { Hash } from "./ruler.renderer";

export interface Hash2D extends Omit<Hash, "value"> {
	value: Vec2;
}

@Component({
	selector: "g-rulers",
	templateUrl: "./rulers.renderer.html",
	providers: [{
		provide: RENDER_ELEMENT,
		useExisting: RulersRenderer,
	}],
	changeDetection: ChangeDetectionStrategy.OnPush,
	standalone: false,
})
export class RulersRenderer extends GroupRenderer implements RenderElement {
	@Input() glyph!: Const<Glyph>;
	@Input() metrics!: Const<FontMetrics>;
	@Input() extras: Hash2D[] = [];

	@Input() viewRect: Const<IRect> = new Rect(0, 0, 0, 0);
	@Input() glyphToCanvas = Matrix.Identity;
	@Input() canvasToGlyph = Matrix.Identity;

	@Input() background: PaintStyle = this.theme.getHex("background", 400)!;

	@Input() lineColor: PaintStyle = this.theme.getHex("background", 900)!;
	@Input() lineColor_emphasis: PaintStyle = this.theme.getHex("foreground", 400)!;

	@Input() textColor: PaintStyle = this.theme.getHex("foreground", 500, 0.6)!;
	@Input() textColor_emphasis: PaintStyle = this.theme.getHex("foreground", 400)!;

	get hashes() {
		const result = {
			x: [] as Hash[],
			y: [] as Hash[],
		};

		const vr = this.viewRect;
		const size = this.canvasToGlyph.transformVector(vr.width, vr.height);
		const origin = this.canvasToGlyph.transformPoint(vr.x, vr.y);
		const glyphRect = new Rect(origin.x, origin.y, size.x, size.y);

		const step
			= (glyphRect.width /   10) < 35 ?   10
			: (glyphRect.width /   25) < 35 ?   25
			: (glyphRect.width /   50) < 35 ?   50
			: (glyphRect.width /  100) < 35 ?  100
			: (glyphRect.width /  250) < 35 ?  250
			: (glyphRect.width /  500) < 35 ?  500
			: (glyphRect.width / 1000) < 35 ? 1000
			: (glyphRect.width / 2500) < 35 ? 2500
			                                : 5000;

		for (let { value, lineColor, textColor } of this.extras) {
			result.x.push({ value: Math.round(value.x), lineColor, textColor });
			result.y.push({ value: Math.round(value.y), lineColor, textColor });
		}

		const xEmphasized = [0, this.glyph.advance];
		const yEmphasized = [
			this.metrics.ascender,
			this.metrics.capHeight,
			this.metrics.xHeight,
			this.metrics.baseline,
			this.metrics.descender,
		];

		let lineColor = this.lineColor_emphasis;
		let textColor = this.textColor_emphasis;

		result.x.push(...xEmphasized.filter(exists).map(value => ({ value, lineColor, textColor })));
		result.y.push(...yEmphasized.filter(exists).map(value => ({ value, lineColor, textColor })));

		lineColor = this.lineColor;
		textColor = this.textColor;

		let gx = Math.round(glyphRect.left);
		while (gx % step) ++gx;
		for (; gx <= glyphRect.right; gx += step)
			result.x.push({ value: gx, lineColor, textColor });

		let gy = Math.round(glyphRect.top);
		while (gy % step) --gy;
		for (; gy >= glyphRect.bottom; gy -= step)
			result.y.push({ value: gy, lineColor, textColor });

		return result;
	}

	constructor (
		public theme: ThemeService,
	) {
		super();
	}
}
