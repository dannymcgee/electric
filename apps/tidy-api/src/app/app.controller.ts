import { Body, Controller, Get, Post } from "@nestjs/common";
import { Entry } from "@tidy-api";

import { FileSystemService } from "./fs.service";

@Controller()
export class AppController {
	constructor (
		private _fs: FileSystemService,
	) {}

	@Post()
	async list(@Body("dir") dir: string): Promise<Entry[]> {
		let results = await this._fs.list(dir);
		return results.filter(Boolean);
	}
}
