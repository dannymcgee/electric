import type { HLJSApi, Language, Mode } from "highlight.js";
import { COMMENTS, HTML_IDENT, stringLit } from "./common";

export default function (hljs: HLJSApi): Language {
	let stringLiteral: Mode = stringLit(hljs);
	let numLiteral: Mode = {
		scope: "number",
		begin: /-?(\.?[0-9]+|[0-9]+[.0-9]*)(px|pt|pc|%|fr|cm|mm|Q|in|r?em|ex|ch|lh|vw|vh|vmin|vmax|m?s)?/,
	};
	let colorLiteral: Mode = {
		scope: "number",
		begin: /#[a-fA-F0-9]{3,8}/,
	};
	let constLiteral: Mode = {
		scope: "const-literal",
		begin: /(true|false|null)/,
	};
	let literals = [
		stringLiteral,
		numLiteral,
		colorLiteral,
		constLiteral,
	];

	let operator: Mode = {
		scope: "oeprator",
		variants: [
			{ begin: /[-+=*\/]/ },
			{ begin: /[=!^|*~$<>]=|[<>]/ },
			{ begin: /=/ },
		],
	};
	let punctuation: Mode = {
		scope: "punctuation",
		begin: /[,:]/,
	};

	let interpolation: Mode = {};

	let variable: Mode = {};
	let mod: Mode = {};
	let func: Mode = {};
	let propValue: Mode = {};
	let values = [
		...COMMENTS,
		interpolation,
		...literals,
		variable,
		mod,
		func,
		propValue,
		operator,
		punctuation,
		{
			scope: "operator",
			begin: /&/,
		},
	];

	Object.assign(interpolation, {
		scope: "interpolation",
		begin: /#\{/,
		beginScope: "punctuation",
		end: /\}/,
		endScope: "punctuation",
		contains: values,
	});

	let atRule: Mode = {};
	let styleRule: Mode = {};
	let varAssignment: Mode = {};

	let classSelector: Mode = {};
	let pseudoElementSelector: Mode = {};
	let pseudoClassSelector: Mode = {};
	let attributeSelector: Mode = {};
	let selectors = [
		classSelector,
		pseudoElementSelector,
		pseudoClassSelector,
		attributeSelector,
		{
			begin: [/&/, HTML_IDENT],
			beginScopes: {
				1: "operator",
				2: "class-name",
			},
		},
	];

	let ruleBlock: Mode = {};

	let rootLevel: Mode[] = [
		...COMMENTS,
		interpolation,
		atRule,
		varAssignment,
		ruleBlock,
		...selectors,
	];

	Object.assign(ruleBlock, {
		scope: "rule-block",
		begin: /\{/,
		beginScope: "brace",
		end: /\}/,
		endScope: "brace",
		contains: [
			interpolation,
			varAssignment,
			styleRule,
			atRule,
			...rootLevel,
		],
	});

	return {
		name: "scss",
		contains: rootLevel,
	};
}
