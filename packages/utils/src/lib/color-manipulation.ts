const UINT8_MAX = 255;
const HEX_RADIX = 16;

export type Hex = string;
export type Uint8 = number;
export type RGB = [Uint8, Uint8, Uint8];

export function uint8ToHex(value: Uint8): Hex {
	if (!isUint8(value)) {
		throw new Error(
			`Value '${value}' is not a valid uint8! Value must be between 0 and 255.`,
		);
	}

	return value.toString(HEX_RADIX)
		.padStart(2, "0")
		.toUpperCase();
}

export function floatToHex(value: number): Hex {
	if (value < 0 || value > 1) {
		throw new Error(
			"Tried to convert invalid number value to hex. Value must be between 0 and 1.",
		);
	}

	return uint8ToHex(Math.round(value * UINT8_MAX));
}

export function hexToRgb(hex: Hex): RGB {
	if (!isHex(hex)) {
		throw new Error(`Value '${hex}' is not a valid hexidecimal string!`);
	}

	let trimmed = hex.replace(/^#/, "");
	let split = trimmed.length === 3
		? trimmed.split("").map(char => char + char)
		: trimmed.match(/.{2}/g)!;

	return split.map(h => parseInt(h, HEX_RADIX)) as RGB;
}

export function rgbToHex(rgb: RGB): Hex {
	if (!isRgb(rgb)) {
		throw new Error(`Value '${rgb}' is not a valid RGB tuple!`);
	}

	return "#" + rgb.map(uint8ToHex).join("");
}

export function formatHex(hex: string): Hex {
	if (!isHex(hex)) {
		throw new Error(`Value '${hex}' is not a valid hexidecimal string!`);
	}
	let trimmed = hex.replace(/^#/, "");
	if (trimmed.length === 3) {
		return "#" + trimmed.replace(/(.)(.)(.)/, "$1$1$2$2$3$3").toUpperCase();
	}
	return "#" + trimmed.toUpperCase();
}

// Type guards
export function isHex(value: string): value is Hex {
	return /^#?([0-9A-F]{6}|[0-9A-F]{3})$/i.test(value.trim());
}
export function isUint8(value: number): value is Uint8 {
	return value >= 0 && value <= UINT8_MAX;
}
export function isRgb(value: [number, number, number]): value is RGB {
	return value.every(isUint8);
}
