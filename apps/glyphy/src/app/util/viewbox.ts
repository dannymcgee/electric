import {
	Directive,
	HostBinding,
	Input,
} from "@angular/core";
import { Option } from "@electric/utils";
import { FontMetrics } from "../family";

import { Font } from "../font";
import { Glyph } from "../glyph/glyph";

export class ViewBox {
	constructor (
		public x: number,
		public y: number,
		public width: number,
		public height: number,
	) {}
}

/**
 * @param zoomFactor
 *    Represents how large the bounding box is compared to the glyph height
 *    measured from ascender to descender.
 */
export function getViewBox(
	font: Font,
	glyph: Glyph,
	zoomFactor: number,
	upperBound: (number | keyof FontMetrics) = "ascender",
	lowerBound: (number | keyof FontMetrics) = "descender",
): ViewBox {
	const upper = typeof upperBound === "number"
		? upperBound
		: font[upperBound] ?? font.ascender;

	const lower = typeof lowerBound === "number"
		? lowerBound
		: font[lowerBound] ?? font.descender;

	const width = glyph.advance ?? 0;
	const rem = zoomFactor - 1;
	const height = (upper - lower) * zoomFactor;
	const y = ((upper - lower) * rem) / 2 - lower;

	return new ViewBox(0, -y, width, height);
}

@Directive({
	selector: "svg[gViewBox]",
	standalone: false,
})
export class ViewBoxDirective {
	@Input("gViewBox") viewBox?: Option<ViewBox>;

	@HostBinding("attr.viewBox")
	get viewBoxAttr() {
		if (!this.viewBox) return "0 0 1000 1000";

		const { x, y, width, height } = this.viewBox;
		return `${x} ${y} ${width} ${height}`
	}
}
