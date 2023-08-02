import { Pipe, PipeTransform } from "@angular/core";

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
export function getViewBox(font: Font, glyph: Glyph, zoomFactor: number): ViewBox {
	const { ascender, descender } = font;
	const width = glyph.advance ?? 0;
	const rem = zoomFactor - 1;
	const height = (ascender - descender) * zoomFactor;
	const y = ((ascender - descender) * rem) / 2 - descender;

	return new ViewBox(0, -y, width, height);
}

@Pipe({ name: "svgViewBox" })
export class FontToSvgViewBoxPipe implements PipeTransform {
	transform(font?: Font, glyph?: Glyph, zoomFactor = 1.333333): string {
		if (!font || !glyph) return "0 0 1000 1000";

		const { x, y, width, height } = getViewBox(font, glyph, zoomFactor);

		return `${x} ${y} ${width} ${height}`;
	}
}
