import type { HLJSApi, Language, Mode } from "highlight.js";

import { COMMENTS, INDENT, JS_IDENT, stringLit } from "./common";
import { regex } from "./util";

export default function (hljs: HLJSApi): Language {
	let keywords = ["export"];

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

	let typeAnnotation: Mode = {
		scope: "type-annotation",
		begin: /\??:/,
		beginScope: "punctuation",
		end: /(?=[;={),])/,
		contains: [
			INDENT,
			...COMMENTS,
			constLiteral,
			{
				scope: "keyword",
				begin: /\b(void|string|number|bigint|boolean)\b/
			},
			{
				scope: "brace",
				begin: /[<>]/,
			},
			{
				scope: "operator",
				begin: /[&|]/,
			},
			{
				scope: "type-name",
				begin: JS_IDENT,
			},
		],
	};

	let assignment: Mode = {
		begin: /=/,
		beginScope: "operator",
		end: /(?=[;,)])/,
		contains: [
			INDENT,
			...literals,
		],
	};

	let block: Mode = {};

	Object.assign(block, {
		scope: "block",
		begin: /\{/,
		beginScope: "brace",
		end: /\}/,
		endScope: "brace",
		contains: [
			INDENT,
			...COMMENTS,
			block,
			...literals,
			{
				begin: [/\b(new)\b\s+/, JS_IDENT],
				beginScope: {
					1: "keyword",
					2: "class-name",
				},
			},
			{
				scope: "keyword",
				begin: /\b(this|return|if|for|switch|case|break|continue)\b/,
			},
			{
				scope: "brace",
				begin: /[()]/,
			},
			{
				scope: "punctuation",
				begin: /[,;?.]/,
			},
			{
				scope: "operator",
				begin: /[-+*\/^&|=!<>]+/,
			},
			{
				scope: "variable",
				begin: JS_IDENT,
			},
		],
	});

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
			{
				scope: "keyword",
				begin: /\b(private|public|static)\b/,
			},
			{
				scope: "method-decl",
				begin: regex`/${JS_IDENT}(?=\s*=?\s*\()/`,
				beginScope: "function",
				end: /\}/,
				endScope: "brace",
				contains: [
					{
						scope: "method-args",
						begin: /\(/,
						beginScope: "brace",
						end: /\)/,
						endScope: "brace",
						contains: [
							INDENT,
							...COMMENTS,
							decorator,
							typeAnnotation,
							assignment,
							{
								scope: "punctuation",
								begin: /,/,
							},
							{
								scope: "keyword",
								begin: /\b(private|public|protected)\b/,
							},
							{
								scope: "variable",
								begin: JS_IDENT,
							},
						],
					},
					typeAnnotation,
					{
						scope: "operator",
						begin: /=>?/,
					},
					{
						...block,
						endsParent: true,
					},
				],
			},
			{
				scope: "accessor-get",
				begin: [/\bget\b\s+/, JS_IDENT, /\(\)/],
				beginScope: {
					1: "keyword",
					2: "prop-name",
					3: "brace",
				},
				end: /\}/,
				endScope: "brace",
				contains: [
					typeAnnotation,
					{
						...block,
						endsParent: true,
					},
				],
			},
			{
				scope: "accessor-set",
				begin: [
					/\bset\b\s+/,
					JS_IDENT,
					/\(/,
					JS_IDENT,
					/\)/
				],
				beginScope: {
					1: "keyword",
					2: "prop-name",
					3: "brace",
					4: "variable",
					5: "brace",
				},
				contains: [
					{
						...block,
						endsParent: true,
					},
				],
			},
			{
				scope: "prop-decl",
				begin: JS_IDENT,
				beginScope: "prop-name",
				end: /;/,
				endScope: "punctuation",
				contains: [
					typeAnnotation,
					assignment,
				],
			},
			{
				scope: "punctuation",
				begin: /;/,
			},
		],
	};

	let importStmt: Mode = {
		scope: "import",
		begin: /\b(import)\b/,
		beginScope: "keyword",
		end: /;/,
		endScope: "punctuation",
		contains: [
			{
				scope: "brace",
				begin: /[{}]/,
			},
			stringLiteral,
			{
				scope: "keyword",
				begin: /\b(as|from)\b/,
			},
			{
				scope: "variable",
				begin: JS_IDENT,
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
			importStmt,
			// TODO: function decl
		],
	};
}
