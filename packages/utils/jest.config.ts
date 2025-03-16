/* eslint-disable */
export default {
	displayName: "utils",

	globals: {},
	transform: {
		"^.+\\.[tj]sx?$": [
			"ts-jest",
			{
				tsconfig: "<rootDir>/tsconfig.spec.json",
			},
		],
	},
	moduleFileExtensions: ["ts", "tsx", "js", "jsx"],
	coverageDirectory: "../../coverage/packages/utils",
	preset: "..\\..\\jest.preset.ts",
};
