import type { HLJSApi, Language, Mode } from "highlight.js";

import { COMMENTS, INDENT, JS_IDENT, stringLit } from "./common";

export default function (hljs: HLJSApi): Language {
	let keywords = [
		"export",
		"public",
		"private",
		"static",
	];

	let stringLiteral: Mode = {};
	let numLiteral: Mode = {};
	let arrLiteral: Mode = {};
	let objLiteral: Mode = {};
	let constLiteral: Mode = {};

	let literals: Mode[] = [
		stringLiteral,
		numLiteral,
		arrLiteral,
		objLiteral,
		constLiteral,
	];

	Object.assign(stringLiteral, stringLit(hljs));

	Object.assign(numLiteral, {
		scope: "number",
		begin: /(\.?[0-9]+)|([0-9][.0-9]*)/
	});

	Object.assign(arrLiteral, {
		scope: "array",
		begin: /\[/,
		beginScope: "brace",
		end: /\]/,
		endScope: "brace",
		contains: [
			INDENT,
			...COMMENTS,
			...literals,
			{
				scope: "punctuation",
				begin: /,/,
			},
		],
	});

	Object.assign(objLiteral, {
		scope: "object",
		begin: /\{/,
		beginScope: "brace",
		end: /\}/,
		endScope: "brace",
		contains: [
			INDENT,
			...COMMENTS,
			{
				begin: [JS_IDENT, /:/],
				beginScope: {
					1: "prop-name",
					2: "punctuation",
				},
				end: /,/,
				endScope: "punctuation",
				contains: [
					INDENT,
					...COMMENTS,
					...literals,
				],
			},
			{
				begin: [JS_IDENT, ','],
				beginScope: {
					1: "prop-name",
					2: "punctuation",
				},
			},
		],
	});

	Object.assign(constLiteral, {
		scope: "const-literal",
		begin: /\b(true|false|null|undefined)\b/,
	});

	let decorator: Mode = {
		scope: "decorator",
		begin: [/@/, JS_IDENT, /\(/],
		beginScope: {
			1: "delimiter",
			2: "decorator-name",
			3: "brace",
		},
		end: /\)/,
		endScope: "brace",
		contains: [
			INDENT,
			...COMMENTS,
			...literals,
		],
	};

	let classDecl: Mode = {
		scope: "class-decl",
		begin: [
			/\b(class)\b/,
			/\s+/,
			JS_IDENT,
			/\s+/,
			/\{/,
		],
		beginScope: {
			1: "storage",
			3: "class-name",
			5: "brace",
		},
		end: /\}/,
		endScope: "brace",
		contains: [
			INDENT,
			...COMMENTS,
			decorator,
			// TODO: methods
			{
				begin: JS_IDENT,
				beginScope: "prop-name",
				end: /;/,
				endScope: "punctuation",
				contains: [
					// TODO: type annotation
					{
						begin: /=/,
						beginScope: "operator",
						end: /(?=;)/,
						contains: [
							INDENT,
							...literals,
						],
					},
				],
			},
		],
	};

	return {
		name: "typescript",
		keywords,
		contains: [
			INDENT,
			...COMMENTS,
			decorator,
			classDecl,
			// TODO: function decl
		],
	};
}
