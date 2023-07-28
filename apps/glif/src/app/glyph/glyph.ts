import { Const } from "@electric/utils";
import * as d3 from "d3";

import { Path } from "./path";
import { Interpreter } from "./vm";

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

		const vm = new Interpreter(this.program);
		vm.exec();

		return vm.path;
	}
}
