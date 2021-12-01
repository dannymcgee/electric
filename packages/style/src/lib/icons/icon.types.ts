export type IconMap<K extends string = string> = {
	[key in K]: string;
};

export interface SvgIconsConfig<T extends IconMap = IconMap> {
	icons: T;
	color?: string;
	sizes: {
		xs: string;
		sm: string;
		md: string;
		lg: string;
	};
}

export type IconSize = keyof SvgIconsConfig["sizes"];
