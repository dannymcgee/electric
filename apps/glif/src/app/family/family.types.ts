import { NewFont } from "../font";

export class NewFamily {
	constructor (
		public name: string,
		public directory: string,
		public fonts: NewFont[],
	) {}
}
