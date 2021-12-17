import type { HLJSApi, Mode } from "highlight.js";

export const HTML_IDENT = /[a-zA-Z$][-a-zA-Z$0-9]*/;
export const JS_IDENT = /[_a-zA-Z$][_a-zA-Z$0-9]*/;

export const INDENT: Mode = {
	scope: "indent",
	begin: /\t/,
};

export const BLOCK_COMMENT: Mode = {
	scope: "comment",
	begin: /\/\*/,
	beginScope: "delimiter",
	end: /\*\//,
	endScope: "delimiter",
};

export const LINE_COMMENT: Mode = {
	scope: "comment",
	begin: /\/\//,
	beginScope: "delimiter",
	end: /$/,
};

export const COMMENTS = [BLOCK_COMMENT, LINE_COMMENT];

export function stringLit(hljs: HLJSApi): Mode {
	return {
		scope: "string",
		contains: [hljs.BACKSLASH_ESCAPE],
		variants: [
			{
				begin: /"/, beginScope: "delimiter",
				end: /"/, endScope: "delimiter",
			},
			{
				begin: /'/, beginScope: "delimiter",
				end: /'/, endScope: "delimiter",
			},
		],
	};
}
