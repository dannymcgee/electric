import { Pipe, PipeTransform } from "@angular/core";

import { Font } from "../font";
import { Glyph } from "./glyph";

export class ViewBox {
	constructor (
		public x: number,
		public y: number,
		public width: number,
		public height: number,
	) {}
}

export function getViewBox(font: Font, glyph: Glyph): ViewBox {
	const { xMin, yMin, yMax } = font.head!;
	const width = glyph.width!;
	const height = yMax - yMin;

	return new ViewBox(xMin, yMin, width, height);
}

@Pipe({ name: "svgViewBox" })
export class FontToSvgViewBoxPipe implements PipeTransform {
	transform(font?: Font, glyph?: Glyph): string {
		if (!font?.head || !glyph) return "0 0 1000 1000";

		const { x, y, width, height } = getViewBox(font, glyph);

		return `${x} ${y} ${width} ${height}`;
	}
}
