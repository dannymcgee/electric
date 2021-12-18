import type { Language, Mode } from "highlight.js";

import { HTML_IDENT, INDENT, JS_IDENT } from "./common";
import { regex } from "./util";

export default function (): Language {
	let expression: Mode[] = [
		INDENT,
		{
			scope: "operator",
			begin: /[-+*\/=;:]+/,
		},
		{
			scope: "keyword",
			begin: /\b(this|let|of|as|else)\b/
		},
		{
			scope: "variable",
			begin: regex`/${JS_IDENT}(?=\()/`
		},
		{
			begin: [/[?!]?\./, JS_IDENT],
			beginScope: {
				1: "punctuation",
				2: "variable",
			},
		},
		{
			scope: "variable",
			begin: JS_IDENT,
		},
		{
			scope: "brace",
			begin: /[()]/,
		},
	];

	let ref: Mode = {
		begin: [/#/, HTML_IDENT],
		beginScope: {
			1: "punctuation",
			2: "variable",
		},
	};

	let propertyBinding: Mode = {
		scope: "binding",
		begin: regex`/(?=\[${HTML_IDENT}\](="[^"]*")?)/`,
		contains: [
			{
				scope: "prop-name",
				begin: /\[/,
				beginScope: "delimiter",
				end: /\]/,
				endScope: "delimiter",
			},
			{
				scope: "operator",
				begin: /=/,
			},
			{
				scope: "expression",
				begin: /"/,
				beginScope: "delimiter",
				end: /"/,
				endScope: "delimiter",
				contains: expression,
			},
		],
	};

	let eventBinding: Mode = {
		scope: "event",
		begin: regex`/(?=\(${HTML_IDENT}\)(="[^"]*")?)/`,
		contains: [
			{
				scope: "prop-name",
				begin: /\(/,
				beginScope: "delimiter",
				end: /\)/,
				endScope: "delimiter",
			},
			{
				scope: "operator",
				begin: /=/,
			},
			{
				scope: "expression",
				begin: /"/,
				beginScope: "delimiter",
				end: /"/,
				endScope: "delimiter",
				contains: expression,
			}
		],
	};

	let structuralDirective: Mode = {
		scope: "structural",
		begin: regex`/(?=\*${JS_IDENT}(="[^"]*")?)/`,
		contains: [
			{
				begin: /\*/,
				beginScope: "operator",
				end: JS_IDENT,
				endScope: "keyword",
			},
			{
				scope: "operator",
				begin: /=/,
			},
			{
				scope: "expression",
				begin: /"/,
				beginScope: "delimiter",
				end: /"/,
				endScope: "delimiter",
				contains: expression,
			},
		],
	};

	let interpolation: Mode = {
		scope: "interpolation",
		begin: /\{\{/,
		beginScope: "brace",
		end: /\}\}/,
		endScope: "brace",
		contains: expression,
	};

	let attr: Mode = {
		scope: "attr",
		begin: regex`/(?=${HTML_IDENT}(="[^"]*")?)/`,
		contains: [
			{
				scope: "attr-name",
				begin: HTML_IDENT,
			},
			{
				scope: "operator",
				begin: /=/,
			},
			{
				scope: "string",
				begin: /"/,
				beginScope: "delimiter",
				end: /"/,
				endScope: "delimiter",
			},
		],
	};

	let tag: Mode = {
		begin: /(?=<)/,
		contains: [{
			scope: "tag open",
			begin: ["<", HTML_IDENT],
			beginScope: {
				1: "punctuation",
				2: "tag-name",
			},
			end: ">",
			endScope: "punctuation",
			contains: [
				ref,
				propertyBinding,
				eventBinding,
				structuralDirective,
				attr,
				INDENT,
			],
		}, {
			scope: "tag close",
			begin: ["</", HTML_IDENT, ">"],
			beginScope: {
				1: "punctuation",
				2: "tag-name",
				3: "punctuation",
			},
		}],
	};

	return {
		name: "html",
		contains: [
			tag,
			INDENT,
			interpolation,
		],
	};
}
