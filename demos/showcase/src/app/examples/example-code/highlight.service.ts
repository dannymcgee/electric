import { Injectable } from "@angular/core";
import type { HighlightOptions, HighlightResult, HLJSApi } from "highlight.js";

@Injectable({
	providedIn: "root"
})
export class HighlightService {
	private _hljs: Promise<HLJSApi>;
	private _registeredLanguages = new Set<string>();

	constructor () {
		this._hljs = import("highlight.js/lib/core").then(mod => mod.default);
	}

	async highlight(
		src: string,
		options: HighlightOptions,
	): Promise<HighlightResult> {
		let hljs = await this._hljs;

		if (!this._registeredLanguages.has(options.language)) {
			switch (options.language) {
				case "html": {
					let htmlLang = (await import("./languages/html.language")).default;
					hljs.registerLanguage("html", htmlLang);
					break;
				}
				case "typescript": {
					let tsLang = (await import("./languages/ts.language")).default;
					hljs.registerLanguage("typescript", tsLang);
					break;
				}
				case "scss": {
					let scssLang = (await import("highlight.js/lib/languages/scss")).default;
					hljs.registerLanguage("scss", scssLang);
					break;
				}
				default: {
					throw new Error(`No handler for language '${options.language}'`);
				}
			}
			this._registeredLanguages.add(options.language);
		}

		return hljs.highlight(src, options);
	}
}
