import { regex } from "@vscode-devkit/grammar";
import { Language, Mode } from "highlight.js";

export const IDENT = /[a-zA-Z$][-a-zA-Z$0-9]*/;

export default function (): Language {
	let indent: Mode = {
		scope: "indent",
		begin: /\t/,
	};

	let attr: Mode = {
		scope: "attr",
		begin: regex`/(?=${IDENT}(="[^"]*")?)/`,
		contains: [{
			scope: "attr-name",
			begin: IDENT,
		}, {
			scope: "operator",
			begin: /=/,
		}, {
			scope: "string",
			begin: /"/,
			beginScope: "delimiter",
			end: /"/,
			endScope: "delimiter",
		}],
	};

	let tag: Mode = {
		begin: /(?=<)/,
		contains: [{
			scope: "tag open",
			begin: ["<", IDENT],
			beginScope: {
				1: "punctuation",
				2: "tag-name",
			},
			end: ">",
			endScope: "punctuation",
			contains: [attr, indent],
		}, {
			scope: "tag close",
			begin: ["</", IDENT, ">"],
			beginScope: {
				1: "punctuation",
				2: "tag-name",
				3: "punctuation",
			},
		}],
	};

	return {
		name: "html",
		contains: [tag, indent],
	};
}
