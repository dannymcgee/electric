import {
	camelToKebabCase,
	Case,
	identifyCase,
	kebabCase,
	pascalCase,
	snakeCase,
	titleCase,
} from "./case-conversion";

describe("identifyCase", () => {
	it("should identify camelCase", () => {
		let result = identifyCase("loremIpsumDolorSitAmet");
		expect(result).toBe(Case.Camel);
	});

	it("should identify Sentence case", () => {
		let result = identifyCase("Lorem ipsum dolor sit amet");
		expect(result).toBe(Case.Title | Case.Spaced);
	});

	it("should identify snake_case", () => {
		let result = identifyCase("lorem_ipsum_dolor_sit_amet");
		expect(result).toBe(Case.Snake);
	});

	it("should identify UPPER_SNAKE_CASE", () => {
		let result = identifyCase("LOREM_IPSUM_DOLOR_SIT_AMET");
		expect(result).toBe(Case.Snake | Case.Title | Case.Upper);
	});

	it("should identify kebab-case", () => {
		let result = identifyCase("lorem-ipsum-dolor-sit-amet");
		expect(result).toBe(Case.Kebab);
	});

	it("should identify PascalCase", () => {
		let result = identifyCase("LoremIpsumDolorSitAmet");
		expect(result).toBe(Case.Title | Case.Camel);
	});
});

describe("camelToKebabCase", () => {
	it("should convert a string in camelCase to kebab-case", () => {
		let input = "loremIpsumDolorSitAmet";
		let expected = "lorem-ipsum-dolor-sit-amet";

		expect(camelToKebabCase(input)).toBe(expected);
	});
});

describe("kebabCase", () => {
	it("should convert from camelCase", () => {
		let input = "loremIpsumDolorSitAmet";
		let expected = "lorem-ipsum-dolor-sit-amet";

		expect(kebabCase(input)).toBe(expected);
	});

	it("should convert from sentence case", () => {
		let input = "Lorem ipsum dolor sit amet";
		let expected = "lorem-ipsum-dolor-sit-amet";

		expect(kebabCase(input)).toBe(expected);
	});

	it("should convert from snake case", () => {
		let input = "lorem_ipsum_dolor_sit_amet";
		let expected = "lorem-ipsum-dolor-sit-amet";

		expect(kebabCase(input)).toBe(expected);
	});

	it("should handle special characters", () => {
		let input = "Godspeed You! Black Emperor";
		let expected = "godspeed-you-black-emperor";

		expect(kebabCase(input)).toBe(expected);
	});

	it("should handle mixed nonsense", () => {
		let wtf = "foo--BAR_Baz;___lorem ipsum; DOLOR_sit-amet";
		let expected = "foo-bar-baz-lorem-ipsum-dolor-sit-amet";

		expect(kebabCase(wtf)).toBe(expected);
	});
});

describe("snakeCase", () => {
	it("should convert from camelCase", () => {
		let input = "loremIpsumDolorSitAmet";
		let expected = "lorem_ipsum_dolor_sit_amet";

		expect(snakeCase(input)).toBe(expected);
	});

	it("should convert from sentence case", () => {
		let input = "Lorem ipsum dolor sit amet";
		let expected = "lorem_ipsum_dolor_sit_amet";

		expect(snakeCase(input)).toBe(expected);
	});

	it("should convert from snake case", () => {
		let input = "lorem_ipsum_dolor_sit_amet";
		let expected = "lorem_ipsum_dolor_sit_amet";

		expect(snakeCase(input)).toBe(expected);
	});

	it("should handle special characters", () => {
		let input = "Godspeed You! Black Emperor";
		let expected = "godspeed_you_black_emperor";

		expect(snakeCase(input)).toBe(expected);
	});

	it("should handle mixed nonsense", () => {
		let wtf = "foo--BAR_Baz;___lorem ipsum; DOLOR_sit-amet";
		let expected = "foo_bar_baz_lorem_ipsum_dolor_sit_amet";

		expect(snakeCase(wtf)).toBe(expected);
	});
});

describe("pascalCase", () => {
	it("should convert from camelCase", () => {
		let input = "loremIpsumDolorSitAmet";
		let expected = "LoremIpsumDolorSitAmet";

		expect(pascalCase(input)).toBe(expected);
	});

	it("should convert from sentence case", () => {
		let input = "Lorem ipsum dolor sit amet";
		let expected = "LoremIpsumDolorSitAmet";

		expect(pascalCase(input)).toBe(expected);
	});

	it("should convert from snake case", () => {
		let input = "lorem_ipsum_dolor_sit_amet";
		let expected = "LoremIpsumDolorSitAmet";

		expect(pascalCase(input)).toBe(expected);
	});

	it("should handle special characters", () => {
		let input = "Godspeed You! Black Emperor";
		let expected = "GodspeedYouBlackEmperor";

		expect(pascalCase(input)).toBe(expected);
	});

	it("should handle mixed nonsense", () => {
		let wtf = "foo--BAR_Baz;___lorem ipsum; DOLOR_sit-amet";
		let expected = "FooBarBazLoremIpsumDolorSitAmet";

		expect(pascalCase(wtf)).toBe(expected);
	});
});

describe("titleCase", () => {
	it("should convert from camelCase", () => {
		let input = "loremIpsumDolorSitAmet";
		let expected = "Lorem Ipsum Dolor Sit Amet";

		expect(titleCase(input)).toBe(expected);
	});

	it("should convert from sentence case", () => {
		let input = "Lorem ipsum dolor sit amet";
		let expected = "Lorem Ipsum Dolor Sit Amet";

		expect(titleCase(input)).toBe(expected);
	});

	it("should convert from snake case", () => {
		let input = "lorem_ipsum_dolor_sit_amet";
		let expected = "Lorem Ipsum Dolor Sit Amet";

		expect(titleCase(input)).toBe(expected);
	});

	it("should handle special characters", () => {
		let input = "Godspeed You! Black Emperor";
		let expected = "Godspeed You Black Emperor";

		expect(titleCase(input)).toBe(expected);
	});

	it("should handle mixed nonsense", () => {
		let wtf = "foo--BAR_Baz;___lorem ipsum; DOLOR_sit-amet";
		let expected = "Foo Bar Baz Lorem Ipsum Dolor Sit Amet";

		expect(titleCase(wtf)).toBe(expected);
	});
});
