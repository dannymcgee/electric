import baseConfig, { angularBase } from "../../eslint.config.mjs";

export default [
	...baseConfig,
	...angularBase("elx"),
	{
		files: ["**/*.ts"],
		rules: {
			"@angular-eslint/component-class-suffix": ["warn", {
				suffixes: ["Component", "Node"],
			}],
			// FIXME: https://github.com/nrwl/nx/issues/30473
			"@nx/enforce-module-boundaries": "off",
		},
	},
];
