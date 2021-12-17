import { Injectable } from "@angular/core";
import type { CursorOptions, CursorResult, Options, Plugin } from "prettier";

interface Prettier {
	formatWithCursor(source: string, options: CursorOptions): CursorResult;
	format(source: string, options?: Options): string;
	check(source: string, options?: Options): boolean;
}

@Injectable({
	providedIn: "root",
})
export class CodeFormatService {
	private _prettier: Promise<Prettier>;
	private _loadedPlugins = new Map<string, Plugin[]>();

	constructor () {
		this._prettier = import("prettier");
	}

	async fmt(src: string, options: Options): Promise<string> {
		let prettier: Prettier = await this._prettier;

		if (!this._loadedPlugins.has(options.parser as string)) {
			switch (options.parser) {
				case "angular": {
					let plugins = await Promise.all([
						import("prettier/parser-angular"),
						import("prettier/parser-html"),
					]);
					this._loadedPlugins.set("angular", plugins);
					break;
				}
				case "scss": {
					let plugins = [await import("prettier/parser-postcss")];
					this._loadedPlugins.set("scss", plugins);
					break;
				}
				case "typescript": {
					let plugins = [await import("prettier/parser-typescript")];
					this._loadedPlugins.set("typescript", plugins);
					break;
				}
			}
		}

		options.plugins = this._loadedPlugins.get(options.parser as string);

		return prettier.format(src, options);
	}
}
