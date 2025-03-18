import {
	ChangeDetectionStrategy,
	Component,
	Input,
	TrackByFunction,
} from "@angular/core";
import { ThemeService } from "@electric/components";
import { Const, Option } from "@electric/utils";

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
	@Input() points: Option<readonly EditorPoint[]>;
	@Input() glyphToCanvas!: Const<Matrix>;

	trackPoint: TrackByFunction<EditorPoint> = (_, p) => p.id;

	constructor (
		public theme: ThemeService,
	) {
		super();
	}
}
