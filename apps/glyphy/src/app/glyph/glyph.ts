import { Pipe, PipeTransform } from "@angular/core";
import { Const } from "@electric/utils";
import * as d3 from "d3";

import { Path } from "./path";

export class Glyph {
	path?: Const<Path>;

	constructor (
		public name?: string,
		public index?: number,
		public charCode?: number,
		public width?: number,
		public lsb?: number,
	) {}

	toString(): string {
		if (!this.path) return "";

		const d3Path = d3.path();
		this.path.replay(d3Path);

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
