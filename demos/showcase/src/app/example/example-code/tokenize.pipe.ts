import { Pipe, PipeTransform } from "@angular/core";
import { regex } from "@vscode-devkit/grammar";
import hljs from "highlight.js";

import { isNotNull } from "@electric/utils";

import { Defaults } from "../example.types";
import { IDENT as HTML_IDENT } from "./html.language";

@Pipe({
	name: "tokenize",
	pure: true,
})
export class TokenizePipe implements PipeTransform {
	transform(markup: string, defaults?: Defaults): string {
		markup = this
			.stripLeadingIndents(markup)
			.map(line => this.stripDefaults(line, defaults))
			.filter(isNotNull)
			.join("\n");

		markup = this.format(markup);
		markup = hljs.highlight(markup, { language: "html" }).value;

		return markup
			.split("\n")
			.map((line, idx) =>
				`<span class="hljs-line-num">${
					idx + 1
				}</span>${
					line.replace("\t", "   ")
				}`
			)
			.join("\n");
	}

	private stripLeadingIndents(markup: string): string[] {
		let leadingIndent = "";
		return markup
			.split("\n")
			.filter(line => !/^\s*$/.test(line))
			.map((line, idx) => {
				if (idx === 0) {
					leadingIndent = line.match(/^\t+/)?.[0] ?? "";
				}
				return line.replace(leadingIndent, "");
			});
	}

	private stripDefaults(line: string, defaults?: Defaults): string | null {
		if (!defaults) return line;

		let match = line.match(regex`/(${HTML_IDENT})="([^"]*)"/`);
		if (!match) return line;

		let [_, key, matchValue] = match;
		let options = defaults[key];

		if (!options) return line;

		let value = typeof options === "object"
			? options.value
			: options;

		if (matchValue === value) {
			if (typeof options === "object" && options.keepAttr) {
				return line.replace(/="([^"]*)"/, "");
			}
			return null;
		}

		return line;
	}

	private format(markup: string): string {
		return markup.replace(/(<)([^\n]+)\n(s*>)/g, "$1$2$3");
	}
}
