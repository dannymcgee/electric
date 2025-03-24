import baseConfig, { angularBase, checkDependencies } from "../../eslint.config.mjs";

export default [
	...baseConfig,
	...angularBase("elx"),
	...checkDependencies(),
];
