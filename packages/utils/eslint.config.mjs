import baseConfig, { checkDependencies } from "../../eslint.config.mjs";

export default [
	...baseConfig,
	...checkDependencies(),
];
