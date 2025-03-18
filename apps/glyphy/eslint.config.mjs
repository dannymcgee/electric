import baseConfig, { angularBase } from "../../eslint.config.mjs";

const EXTRA_SUFFIXES = [
	"Dialog",
	"Renderer",
	"Tool",
];

export default [
	...baseConfig,
	...angularBase("g"),
	{
		files: ["**/*.ts"],
		rules: {
			"@angular-eslint/component-class-suffix": ["warn", {
				suffixes: ["Component", ...EXTRA_SUFFIXES],
			}],
			"@angular-eslint/directive-class-suffix": ["warn", {
				suffixes: ["Directive", ...EXTRA_SUFFIXES],
			}],
			"@angular-eslint/no-output-native": "warn",
		},
	},
];
