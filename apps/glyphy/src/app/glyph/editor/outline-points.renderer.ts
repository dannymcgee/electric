import { ChangeDetectionStrategy, Component, inject, Input } from "@angular/core";
import { ThemeService } from "@electric/components";
import { Const, Opt } from "@electric/utils";

import { Matrix } from "../../math";
import { GroupRenderer, RenderElement, RENDER_ELEMENT } from "../../render";
import { EditorPoint } from "./types";

@Component({
	selector: "g-outline-points",
	templateUrl: "./outline-points.renderer.html",
	providers: [{
		provide: RENDER_ELEMENT,
		useExisting: OutlinePointsRenderer,
	}],
	changeDetection: ChangeDetectionStrategy.OnPush,
	standalone: false,
})
export class OutlinePointsRenderer extends GroupRenderer implements RenderElement {
	@Input() points: Opt<readonly EditorPoint[]>;
	@Input() glyphToCanvas!: Const<Matrix>;

	theme = inject(ThemeService);
}
