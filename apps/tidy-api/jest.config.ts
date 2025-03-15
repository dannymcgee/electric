module.exports = {
	displayName: "tidy-api",

	globals: {
		"ts-jest": {
			tsconfig: "<rootDir>/tsconfig.spec.json",
		},
	},
	testEnvironment: "node",
	transform: {
		"^.+\\.[tj]s$": "ts-jest",
	},
	moduleFileExtensions: ["ts", "js", "html"],
	coverageDirectory: "../../coverage/apps/tidy-api",
	preset: "..\\..\\jest.preset.ts",
};
