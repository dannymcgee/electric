import { match } from "@electric/utils";

import { FontFamily } from "../family";
import { Glyph } from "../glyph";
import { NameID, PlatformID } from "../open-type";

export { NameID, PlatformID };

export enum FontWeight {
	Thin       = 100,
	ExtraLight = 200,
	Light      = 300,
	Regular    = 400,
	Medium     = 500,
	SemiBold   = 600,
	Bold       = 700,
	ExtraBold  = 800,
	Black      = 900,
}

export enum FontStyle {
	Upright = "",
	Italic = "Italic",
	Oblique = "Oblique",
}

export class Font {
	weight: FontWeight;
	style: FontStyle;
	italicAngle = 0;

	get styleName() {
		return `${FontWeight[this.weight]} ${this.style}`.trim();
	}

	get fullName() {
		return `${this.family.name} ${this.styleName}`;
	}

	get postScriptName() {
		return `${
			this.family.name.replace(/\s/g, "")
		}-${
			FontWeight[this.weight]
		}${
			this.style
		}`;
	}

	get unitsPerEm() { return this._family.unitsPerEm; }
	get ascender() { return this._family.ascender; }
	get descender() { return this._family.descender; }
	get xHeight() { return this._family.xHeight; }
	get capHeight() { return this._family.capHeight; }

	get glyphs(): readonly Glyph[] { return this._glyphs; }
	private _glyphs: Glyph[];

	get family() { return this._family; }
	private _family: FontFamily;

	constructor (
		family: FontFamily,
		weight: FontWeight = FontWeight.Regular,
		style: FontStyle = FontStyle.Upright,
		italicAngle?: number,
		glyphs?: Glyph[],
	) {
		this._family = family;
		this.weight = weight;
		this.style = style;
		this.italicAngle = italicAngle ?? match(style, {
			[FontStyle.Upright]: () => 0,
			[FontStyle.Italic]: () => -10,
			[FontStyle.Oblique]: () => -10,
		});
		this._glyphs = glyphs ?? [];
	}
}