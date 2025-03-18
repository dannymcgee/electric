import { ChangeDetectionStrategy, Component, Input } from "@angular/core";
import { ThemeService } from "@electric/components";
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
	@Input() glyphToCanvas!: Const<Matrix>;
	@Input() viewRect!: Const<IRect>;

	constructor (
		public theme: ThemeService,
	) {
		super();
	}
}
