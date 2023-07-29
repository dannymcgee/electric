import {
	ChangeDetectionStrategy,
	Component,
	HostBinding,
	Input,
	OnChanges,
	SimpleChanges,
	ViewEncapsulation,
} from "@angular/core";

import { Font } from "../font";
import { Glyph } from "./glyph";
import { getViewBox, ViewBox } from "../util";

@Component({
	selector: "svg[g-glyph]",
	templateUrl: "./glyph.component.svg",
	styleUrls: ["./glyph.component.scss"],
	changeDetection: ChangeDetectionStrategy.OnPush,
	encapsulation: ViewEncapsulation.None,
})
export class GlyphComponent implements OnChanges {
	@Input() glyph?: Glyph;

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

	private _viewBox?: ViewBox;

	constructor (
		public _font: Font,
	) {}

	ngOnChanges(changes: SimpleChanges): void {
		if ("glyph" in changes && this.glyph)
			this._viewBox = getViewBox(this._font, this.glyph);
	}
}
