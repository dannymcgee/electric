import { Const } from "@electric/utils";

import { Path } from "./path";

export class Glyph {
	outline?: Const<Path>;

	constructor (
		public fontStyle: string,
		public name: string,
		public index: number,
		public unicode?: number,
		public advance?: number,
		public lsb?: number,
	) {}

	toString(): string {
		return this.outline?.svg ?? "";
	}
}
