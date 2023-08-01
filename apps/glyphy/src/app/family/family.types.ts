export class NewFontFamily {
	constructor (
		public name: string,
		public directory: string,
	) {}
}

export interface FontMetrics {
	unitsPerEm: number;
	descender: number;
	xHeight?: number;
	capHeight?: number;
	ascender: number;
}

export function defaultMetrics(): FontMetrics {
	return {
		unitsPerEm: 1000,
		descender: -200,
		xHeight: 550,
		capHeight: 700,
		ascender: 800,
	};
}

export class FontFamily implements FontMetrics {
	name: string;
	declare unitsPerEm: number;
	declare descender: number;
	declare xHeight?: number;
	declare capHeight?: number;
	declare ascender: number;

	constructor (name: string, metrics = defaultMetrics()) {
		this.name = name;
		Object.assign(this, metrics);
	}
}
