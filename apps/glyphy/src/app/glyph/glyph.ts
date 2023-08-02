import { Pipe, PipeTransform } from "@angular/core";
import { Const } from "@electric/utils";
import * as d3 from "d3";

import { Path } from "./path";

export class Glyph {
	outline?: Const<Path>;

	constructor (
		public name?: string,
		public index?: number,
		public unicode?: number,
		public advance?: number,
		public lsb?: number,
	) {}

	toString(): string {
		if (!this.outline) return "";

		const d3Path = d3.path();
		this.outline.replay(d3Path);

		return d3Path.toString();
	}
}

@Pipe({ name: "svg" })
export class GlyphToSvgPipe implements PipeTransform {
	transform(glyph: Glyph | undefined) {
		if (!glyph) return "";
		return glyph.toString();
	}
}
