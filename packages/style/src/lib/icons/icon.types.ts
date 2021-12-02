export interface SvgIconsConfig {
	icons: Record<string, string>;
	color?: string;
	sizes: {
		xs: string;
		sm: string;
		md: string;
		lg: string;
	};
}

export type IconSize = keyof SvgIconsConfig["sizes"];
