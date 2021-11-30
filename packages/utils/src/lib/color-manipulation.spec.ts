import {
	floatToHex,
	formatHex,
	hexToRgb,
	rgbToHex,
	uint8ToHex,
} from "./color-manipulation";

describe("uint8ToHex", () => {
	it("should convert a value from 0 - 255 to its equivalent hex value", () => {
		expect(uint8ToHex(0)).toBe("00");
		expect(uint8ToHex(255)).toBe("FF");
		expect(uint8ToHex(128)).toBe("80");
	});

	it("should throw an error if an invalid value is passed", () => {
		expect(() => uint8ToHex(420)).toThrow();
	});
});

describe("floatToHex", () => {
	it("should convert a value from 0 - 1 to its equivalent hex value", () => {
		expect(floatToHex(0)).toBe("00");
		expect(floatToHex(1)).toBe("FF");
		expect(floatToHex(0.5)).toBe("80");
	});

	it("should throw an error if an invalid value is passed", () => {
		expect(() => floatToHex(42)).toThrow();
	});
});

describe("hexToRgb", () => {
	it("should throw an error if an invalid value is passed", () => {
		expect(() => hexToRgb("Hello world")).toThrow();
	});

	it("should support 3-digit hex values", () => {
		expect(hexToRgb("#FFF")).toEqual([255, 255, 255]);
		expect(hexToRgb("#000")).toEqual([0, 0, 0]);
		expect(hexToRgb("#F00")).toEqual([255, 0, 0]);
		expect(hexToRgb("#0F0")).toEqual([0, 255, 0]);
		expect(hexToRgb("#00F")).toEqual([0, 0, 255]);
	});

	it("should support 6-digit hex values", () => {
		expect(hexToRgb("#808080")).toEqual([128, 128, 128]);
	});

	it("should support lowercase", () => {
		expect(hexToRgb("#fff")).toEqual([255, 255, 255]);
	});

	it("should accurately convert our brand colors :)", () => {
		expect(hexToRgb("#7A2EE5")).toEqual([122, 46, 229]);
	});
});

describe("rgbToHex", () => {
	it("should convert an RGB tuple to hex", () => {
		expect(rgbToHex([255, 255, 255])).toMatch(/#ffffff/i);
		expect(rgbToHex([0, 0, 0])).toMatch(/#000000/i);
		expect(rgbToHex([128, 128, 128])).toMatch(/#808080/i);
	});

	it("should throw an error if an invalid value is passed", () => {
		expect(() => rgbToHex([420, 420, 420])).toThrow();
	});
});

describe("formatHex", () => {
	it("should apply consistent formatting to hex values", () => {
		expect(formatHex("#fff")).toBe("#FFFFFF");
		expect(formatHex("#FfF")).toBe("#FFFFFF");
		expect(formatHex("fff")).toBe("#FFFFFF");
		expect(formatHex("ffffff")).toBe("#FFFFFF");
		expect(formatHex("#ffffff")).toBe("#FFFFFF");
	});

	it("should throw an error if an invalid value is passed", () => {
		expect(() => formatHex("Hello world!")).toThrow();
	});
});
