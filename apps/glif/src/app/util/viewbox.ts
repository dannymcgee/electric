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

export function getViewBox(font: Font, glyph: Glyph): ViewBox {
	const { ascender, descender } = font;
	const width = glyph.width ?? 0;
	const height = (ascender - descender) * 1.333333;
	const y = ((ascender - descender) * 0.333333) / 2 - descender;

	return new ViewBox(0, -y, width, height);
}

@Pipe({ name: "svgViewBox" })
export class FontToSvgViewBoxPipe implements PipeTransform {
	transform(font?: Font, glyph?: Glyph): string {
		if (!font || !glyph) return "0 0 1000 1000";

		const { x, y, width, height } = getViewBox(font, glyph);

		return `${x} ${y} ${width} ${height}`;
	}
}
