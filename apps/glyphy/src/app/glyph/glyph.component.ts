import {
	ChangeDetectionStrategy,
	Component,
	HostBinding,
	Input,
	OnChanges,
	SimpleChanges,
	ViewEncapsulation,
} from "@angular/core";
import { Coerce } from "@electric/ng-utils";

import { FamilyService } from "../family";
import { getViewBox, ViewBox } from "../util";
import { Glyph } from "./glyph";
import { GlyphScaleFactorProvider } from "./glyph-scale-factor.service";

@Component({
	selector: "svg[g-glyph]",
	templateUrl: "./glyph.component.svg",
	styleUrls: ["./glyph.component.scss"],
	providers: [GlyphScaleFactorProvider],
	changeDetection: ChangeDetectionStrategy.OnPush,
	encapsulation: ViewEncapsulation.None,
})
export class GlyphComponent implements OnChanges {
	@Input() glyph?: Glyph;

	@Coerce(Number)
	@Input() zoomFactor = 1.25;

	@HostBinding("class")
	readonly hostClass = "g-glyph";

	@HostBinding("attr.fill")
	readonly fill = "currentColor";

	@HostBinding("attr.viewBox")
	get viewBoxAttr() {
		if (!this._viewBox) return "0 0 1000 1000";

		const { x, y, width, height } = this._viewBox;
		return `${x} ${y} ${width} ${height}`
	}

	_viewBox?: ViewBox;

	constructor (
		public _family: FamilyService,
	) {}

	ngOnChanges(changes: SimpleChanges): void {
		if (this.glyph && ("glyph" in changes || "zoomFactor" in changes)) {
			// TODO: This should be more reactive
			const font = this._family.font;
			if (!font) return;

			this._viewBox = getViewBox(font, this.glyph, this.zoomFactor);
		}
	}
}