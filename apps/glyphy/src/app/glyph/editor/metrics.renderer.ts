import { ChangeDetectionStrategy, Component, inject, Input } from "@angular/core";
import { ThemeService } from "@electric/components";
import { Coerce } from "@electric/ng-utils";
import { Const } from "@electric/utils";

import { FontMetrics } from "../../family";
import { IRect, Matrix } from "../../math";
import { GroupRenderer, RenderElement, RENDER_ELEMENT } from "../../render";
import { Glyph } from "../glyph";

@Component({
	selector: "g-canvas-metrics",
	templateUrl: "./metrics.renderer.html",
	providers: [{
		provide: RENDER_ELEMENT,
		useExisting: MetricsRenderer,
	}],
	changeDetection: ChangeDetectionStrategy.OnPush,
	standalone: false,
})
export class MetricsRenderer extends GroupRenderer implements RenderElement {
	@Input() glyph!: Const<Glyph>;
	@Input() metrics!: Const<FontMetrics>;
	@Input() italicAngle = 0;
	@Input() glyphToCanvas!: Const<Matrix>;
	@Input() viewRect!: Const<IRect>;

	// FIXME: This needs to be a font-level configuration
	caretOffset = -45;

	Matrix = Matrix;

	theme = inject(ThemeService);
}

@Component({
	selector: "g-metrics-guide",
	template: `

@switch (orientation) {
	@case ('horizontal') {
		<g-line
			[x1]="viewRect.left" [x2]="viewRect.right"
			[y1]="value" [y2]="value"
			[yTransform]="glyphToCanvas"
			strokeWidth="1"
			[stroke]="lineColor"
		/>
		@if (label) {
			<g-text
				[value]="label"
				[x]="viewRect.left + 28 + 16"
				[y]="value"
				[yTransform]="glyphToCanvas"
				fontFamily="Consolas"
				fontSize="14"
				align="left"
				baseline="middle"
				[fill]="theme.getHex('foreground', 500, 0.6)"
				[background]="theme.getHex('background', 200)"
				padding="0 8"
			/>
		}
	}
	@case ('vertical') {
		@if (italicAngle) {
			<g-line
				[x1]="value" [x2]="value"
				[y1]="-9999" [y2]="9999"
				[transform]="Matrix.concat(
					Matrix.skew(-italicAngle).withOrigin(value, 0),
					Matrix.translate(caretOffset, 0),
					glyphToCanvas
				)"
				[strokeWidth]="1"
				[stroke]="lineColor"
			/>
		} @else {
			<g-line
				[x1]="value" [x2]="value"
				[y1]="viewRect.top" [y2]="viewRect.bottom"
				[xTransform]="glyphToCanvas"
				[strokeWidth]="1"
				[stroke]="lineColor"
			/>
		}
	}
}

	`,
	providers: [{
		provide: RENDER_ELEMENT,
		useExisting: MetricsGuideRenderer,
	}],
	standalone: false,
})
export class MetricsGuideRenderer extends GroupRenderer implements RenderElement {
	@Input() orientation!: "vertical" | "horizontal";
	@Input() label?: string;

	@Coerce(Number)
	@Input() value = 0;

	@Coerce(Boolean)
	@Input() strong = false;

	_parent = inject(MetricsRenderer);
	theme = inject(ThemeService);
	Matrix = Matrix;

	get glyphToCanvas() { return this._parent.glyphToCanvas }
	get viewRect() { return this._parent.viewRect }

	get italicAngle() { return this._parent.italicAngle }
	get caretOffset() { return this._parent.caretOffset }

	get lineColor() {
		return this.strong
			? this.theme.getHex("background", 700, 0.75)
			: this.theme.getHex("background", 600, 0.4);
	}
}
