import baseConfig, { angularBase, checkDependencies } from "../../eslint.config.mjs";

export default [
	...baseConfig,
	...angularBase("elx"),
	...checkDependencies(),
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
