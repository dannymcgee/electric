import { Pipe, PipeTransform } from "@angular/core";
import { Const } from "@electric/utils";
import * as d3 from "d3";

import { Path } from "./path";
import { InterpreterCFF2 } from "../outlines";

export class Glyph {
	path?: Const<Path>;

	constructor (
		public name?: string,
		public index?: number,
		public charCode?: number,
		public width?: number,
		public lsb?: number,
		public program?: string,
	) {
		this.path = this.interpret();
	}

	toString(): string {
		this.path ??= this.interpret();
		if (!this.path) return "";

		const d3Path = d3.path();
		this.path.replay(d3Path);

		return d3Path.toString();
	}

	private interpret(): Const<Path> | undefined {
		if (!this.program) return;

		// TODO
		const vm = new InterpreterCFF2(this.program);
		vm.exec();

		return vm.path;
	}
}

@Pipe({ name: "svg" })
export class GlyphToSvgPipe implements PipeTransform {
	transform(glyph: Glyph | undefined) {
		if (!glyph) return "";
		return glyph.toString();
	}
}
