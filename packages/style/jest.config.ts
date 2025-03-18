export default {
	displayName: "style",

	globals: {},
	testEnvironment: "node",
	transform: {
		"^.+\\.[tj]sx?$": [
			"ts-jest",
			{
				tsconfig: "<rootDir>/tsconfig.spec.json",
			},
		],
	},
	moduleFileExtensions: ["ts", "tsx", "js", "jsx"],
	coverageDirectory: "../../coverage/packages/style",
	preset: "../../jest.preset.js",
};
