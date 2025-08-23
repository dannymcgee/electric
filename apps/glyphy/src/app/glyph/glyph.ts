import { Const } from "@electric/utils";

import { Path } from "./path";

export class Glyph {
	outline?: Const<Path>;

	get trackId(): string {
		let result = `${this.fontStyle} ${this.name}`;
		if (this.unicode != null)
			return `${result} 0x${this.unicode.toString(16).toUpperCase()}`;

		return result;
	}

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
