import {
	array,
	camelToKebabCase,
	entries,
	formatHex,
	Hex,
	hexToRgb,
	isHex,
	RGB,
} from "@electric/utils";
import {
	ColorSchemeName,
	ThemeColor,
	ThemeColorShade,
	ThemeDefinition,
} from "./theme.types";

type NamedColorPalette = { name: ThemeColor } & Record<ThemeColorShade, Color>;

export interface ReadonlyThemeColorStore extends Iterable<NamedColorPalette> {
	get(name: ThemeColor, shade: ThemeColorShade): Color | null;
}

export class Color {
	readonly hex: Hex;
	readonly rgb: RGB;

	constructor (hex: Hex) {
		if (!isHex(hex)) {
			throw new Error(`Value '${hex}' is not a valid hexidecimal string!`);
		}

		this.hex = formatHex(hex);
		this.rgb = hexToRgb(hex);
	}
}

export class ThemeColorStore implements Iterable<NamedColorPalette> {
	private _data = new Map<ThemeColor, Map<ThemeColorShade, Color>>();

	*[Symbol.iterator](): Iterator<NamedColorPalette> {
		for (let [name, shadesMap] of this._data.entries()) {
			yield array(shadesMap.entries())
				.reduce<NamedColorPalette>((accum, [shade, color]) => ({
					...accum,
					[shade]: color,
				}), { name } as any);
		}
	}

	setColorScheme(
		theme: ThemeDefinition,
		scheme: ColorSchemeName,
		styles: CSSStyleDeclaration,
	): void {
		let colorScheme = theme[scheme];
		if (!colorScheme) {
			throw new Error(`No color scheme defined for key "${scheme}"!`);
		}

		let { colors, vars } = colorScheme;
		for (let [name, shades] of entries(colors)) {
			if (!shades) continue;

			for (let [shade, value] of entries(shades)) {
				if (!value) continue;

				let color = this.set(name, shade, value);
				styles.setProperty(`--${name}-${shade}`, color.rgb.join(", "));
			}
		}

		if (!vars) return;
		for (let [key, value] of entries(vars)) {
			let name = camelToKebabCase(key as string);
			styles.setProperty(`--${name}`, value.toString());
		}
	}

	set(
		name: ThemeColor,
		shade: ThemeColorShade,
		value: Hex,
	): Color {
		let shadesMap = this._data.get(name) ?? new Map<ThemeColorShade, Color>();
		let color = new Color(value);

		shadesMap.set(+shade as ThemeColorShade, color);
		if (!this._data.has(name)) {
			this._data.set(name, shadesMap);
		}

		return color;
	}

	get(name: ThemeColor, shade: ThemeColorShade): Color | null {
		return this._data.get(name)?.get(shade) ?? null;
	}
}
