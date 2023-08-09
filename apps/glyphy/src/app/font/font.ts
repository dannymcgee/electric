import { match } from "@electric/utils";

import { FontFamily } from "../family";
import { Glyph } from "../glyph";
import { NameID, PlatformID } from "../open-type";

export { NameID, PlatformID };

export enum FontWeight {
	Thin       = 100,
	ExtraLight = 200,
	Light      = 300,
	SemiLight  = 350,
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
	weight: FontWeight | number;
	weightName: string;
	style: FontStyle;
	italicAngle = 0;

	private _previewGlyph?: Glyph;
	get previewGlyph(): Glyph | undefined {
		return this._previewGlyph ??= this.glyphs.find(g => g.name === "a");
	}

	get styleName() {
		return `${this.weightName} ${this.style}`.trim();
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
	get baseline() { return this._family.baseline ?? 0; }
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
		weightName = FontWeight[weight],
		style: FontStyle = FontStyle.Upright,
		italicAngle?: number,
		glyphs?: Glyph[],
	) {
		this._family = family;
		this.weight = weight;
		this.weightName = weightName,
		this.style = style;
		this.italicAngle = italicAngle ?? match(style, {
			[FontStyle.Upright]: () => 0,
			[FontStyle.Italic]: () => -10,
			[FontStyle.Oblique]: () => -10,
		});
		this._glyphs = glyphs ?? [];
	}
}
