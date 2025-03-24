import nx from "@nx/eslint-plugin";

/**
 * @param {string|unknown[]} prefix The component/directive prefix(es) for the Angular project
 */
export function angularBase(prefix) {
	return [
		...nx.configs["flat/angular"],
		{
			files: ["**/*.ts"],
			rules: {
				"@angular-eslint/component-selector": ["error", {
					type: ["element", "attribute"],
					prefix,
				}],
				"@angular-eslint/directive-selector": ["error", {
					type: ["attribute"],
					prefix,
				}],
				"@angular-eslint/prefer-standalone": "off",
				"@angular-eslint/no-input-rename": "off",
				"@angular-eslint/no-output-rename": "off",
			},
		},
	];
}


/**
 * @param {string[]} extraIgnoredFiles
 */
export function checkDependencies(extraIgnoredFiles = []) {
	return [{
		files: ["**/*.json"],
		rules: {
			"@nx/dependency-checks": ["error", {
				ignoredFiles: [
					"{projectRoot}/eslint.config.{js,cjs,mjs}",
					"{projectRoot}/vite.config.{js,ts,mjs,mts}",
					"{projectRoot}/**/*.{spec,test}.{js,ts,mjs,mts,jsx,tsx}",
					...extraIgnoredFiles,
				],
			}],
		},
	}];
}

export default [
	...nx.configs["flat/base"],
	...nx.configs["flat/typescript"],
	...nx.configs["flat/javascript"],
	{
		ignores: [
			"node_modules",
			"**/dist",
			"target",
			"tmp",
		],
	},
	{
		files: [
			"**/*.ts", "**/*.tsx",
			"**/*.js", "**/*.jsx",
		],
		rules: {
			"@nx/enforce-module-boundaries": ["error", {
				enforceBuildableLibDependency: true,
				allow: ["^.*/eslint(\\.base)?\\.config\\.[cm]?js$"],
				depConstraints: [{
					sourceTag: "*",
					onlyDependOnLibsWithTags: ["*"],
				}],
			}],
		},
	},
	{
		files: [
			"**/*.ts", "**/*.tsx", "**/*.cts", "**/*.mts",
			"**/*.js", "**/*.jsx", "**/*.cjs", "**/*.mjs",
		],
		// Override or add rules here
		rules: {
			"prefer-const": "off",
			"@typescript-eslint/no-empty-function": "off",
			"@typescript-eslint/no-non-null-assertion": "off",
			"@typescript-eslint/no-explicit-any": "off",
			"@typescript-eslint/no-unused-vars": ["warn", {
				argsIgnorePattern: "^_",
				caughtErrorsIgnorePattern: "^_",
				destructuredArrayIgnorePattern: "^_",
				varsIgnorePattern: "^_",
			}]
		}
	},
	{
		files: ["**/*.json"],
		languageOptions: {
			parser: await import("jsonc-eslint-parser"),
		},
	},
];
