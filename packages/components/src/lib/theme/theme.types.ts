export type ThemeColor =
	| "primary"
	| "accent"
	| "warning"
	| "foreground"
	| "background";

export type ThemeColorShade =
	| 50
	| 100
	| 200
	| 300
	| 400
	| 500
	| 600
	| 700
	| 800
	| 900;

export type ThemeColorShades = Partial<Record<ThemeColorShade, string>>;
export type ThemeColorPalettes = Partial<Record<ThemeColor, ThemeColorShades>>;

export interface ThemeVars {
	[key: string]: string | number;
}

export interface ColorScheme {
	colors: ThemeColorPalettes;
	vars?: ThemeVars;
}

export type ColorSchemeName = keyof ThemeDefinition;
export interface ThemeDefinition {
	light?: ColorScheme;
	dark?: ColorScheme;
	highContrast?: ColorScheme;
}
