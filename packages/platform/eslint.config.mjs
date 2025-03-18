import baseConfig, { angularBase } from "../../eslint.config.mjs";

export default [
	...baseConfig,
	...angularBase("elx"),
];
