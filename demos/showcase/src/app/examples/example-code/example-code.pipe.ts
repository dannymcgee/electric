import { DestroyRef, inject, Pipe, PipeTransform } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import * as prettier from "prettier/standalone";
import type { Config as PrettierConfig } from "prettier";

import { exists, match } from "@electric/utils";

import { Defaults } from "../examples.types";
import { HTML_IDENT } from "./languages/common";
import { regex } from "./languages/util";
import { HighlightService } from "./highlight.service";
import {
	catchError,
	distinctUntilChanged,
	filter,
	from,
	map,
	Observable,
	Subject,
	switchMap,
} from "rxjs";

@Pipe({
	name: "highlight",
	standalone: false,
})
export class HighlightPipe implements PipeTransform {
	constructor (
		private _highlighter: HighlightService,
	) {}

	async transform(markup: string, language: string): Promise<string> {
		return this._highlighter
			.highlight(markup, { language })
			.then(result => result.value);
	}
}

@Pipe({
	name: "lines",
	standalone: false,
})
export class LinesPipe implements PipeTransform {
	transform(src?: string): string[] {
		return src?.split("\n") ?? [];
	}
}

@Pipe({
	name: "stripIndents",
	standalone: false,
})
export class StripIndentsPipe implements PipeTransform {
	transform(lines?: string[]): string[] {
		if (!lines) return [];

		let leadingIndent = lines
			.find(line => !/^\s*$/.test(line))
			?.match(/^\t+/)?.[0]
			?? "";

		return lines.map(line => line.replace(leadingIndent, ""));
	}
}

@Pipe({
	name: "stripDefaults",
	standalone: false,
})
export class StripDefaultsPipe implements PipeTransform {
	transform(lines?: string[], defaults?: Defaults): string[] {
		if (!lines) return [];
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
			.filter(exists);
	}
}

@Pipe({
	name: "fmt",
	pure: false,
	standalone: false,
})
export class FormatCodePipe implements PipeTransform {
	#inputs$ = new Subject<[string[]?, string?]>();
	#value$?: Observable<string[]>;

	#destroyRef = inject(DestroyRef);

	transform(lines?: string[], language?: string): Observable<string[]> {
		this.#inputs$.next([lines, language]);

		return this.#value$ ??= this.#inputs$.pipe(
			filter((input): input is [string[], string] => input[0] != null && input[1] != null),
			distinctUntilChanged(([prevLines, prevLang], [lines, lang]) => (
				lang === prevLang
				&& lines.length === prevLines.length
				&& lines.every((line, i) => prevLines[i] === line)
			)),
			switchMap(([lines, lang]) => from(
				optionsFor(lang)
					.then(options => prettier.format(lines.join("\n"), options))
					.then(txt => txt.split("\n"))
			)),
			catchError(err => {
				console.error(err);
				return [] as string[];
			}),
			map(value => typeof value === "string" ? value.split("\n") : value),
			takeUntilDestroyed(this.#destroyRef),
		);
	}
}

function optionsFor(language: string): Promise<PrettierConfig> {
	return match(language, {
		html: async () => ({
			parser: "angular",
			useTabs: true,
			printWidth: 50,
			plugins: await Promise.all([
				import("prettier/plugins/html"),
				import("prettier/plugins/angular"),
			]),
		}),
		scss: async () => ({
			parser: "scss",
			useTabs: true,
			plugins: [await import("prettier/plugins/postcss")]
		}),
		typescript: async () => ({
			parser: "typescript",
			useTabs: true,
			plugins: await Promise.all([
				import("prettier/plugins/typescript"),
				import("prettier/plugins/estree"),
			]),
		}),
		_: async () => {
			console.error(`Unrecognized language "${language}"`);
			return {};
		},
	});
}

@Pipe({
	name: "joinLines",
	standalone: false,
})
export class JoinLinesPipe implements PipeTransform {
	transform(lines?: string[]): string {
		if (!lines) return "";
		return lines.join("\n");
	}
}
