import { Pipe, PipeTransform } from "@angular/core";
import { regex } from "@vscode-devkit/grammar";
import hljs from "highlight.js";

import { isNotNull } from "@electric/utils";

import { Defaults } from "../example.types";
import { IDENT as HTML_IDENT } from "./html.language";

@Pipe({ name: "highlight" })
export class HighlightPipe implements PipeTransform {
	transform(markup: string, language: string): string {
		return hljs.highlight(markup, { language }).value;
	}
}

@Pipe({ name: "lines" })
export class LinesPipe implements PipeTransform {
	transform(src?: string): string[] {
		return src?.split("\n") ?? [];
	}
}

@Pipe({ name: "stripIndents" })
export class StripIndentsPipe implements PipeTransform {
	transform(lines: string[]): string[] {
		let leadingIndent = lines
			.find(line => !/^\s*$/.test(line))
			?.match(/^\t+/)?.[0]
			?? "";

		return lines.map(line => line.replace(leadingIndent, ""));
	}
}

@Pipe({ name: "stripDefaults" })
export class StripDefaultsPipe implements PipeTransform {
	transform(lines: string[], defaults?: Defaults): string[] {
		if (!defaults) return lines;

		return lines
			.map(line => {
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
			})
			.filter(isNotNull);
	}
}

@Pipe({ name: "fmt" })
export class FormatCodePipe implements PipeTransform {
	transform(lines: string[]): string[] {
		let openAngles = 0;
		let closeAngles = 0;

		return lines.reduce((accum, line) => {
			openAngles += line.match(/</g)?.length ?? 0;
			closeAngles += line.match(/>/g)?.length ?? 0;
			let inTag = !!((openAngles - closeAngles) % 2);

			if (/^\s*$/.test(line)) {
				if (inTag) return accum;

				accum.push("");
				return accum;
			}

			if (accum.length) {
				let prev = accum.pop()!;
				if (prev.startsWith("<") && line.endsWith(">")) {
					accum.push(`${prev}${line}`);
				} else {
					accum.push(prev);
					accum.push(line);
				}
			} else {
				accum.push(line);
			}
			return accum;
		}, [] as string[]);
	}
}

@Pipe({ name: "joinLines" })
export class JoinLinesPipe implements PipeTransform {
	transform(lines: string[]): string {
		return lines.join("\n");
	}
}
