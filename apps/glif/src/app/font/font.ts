import { match } from "@electric/utils";

import { FontFamily } from "../family";
import { Glyph } from "../glyph";
import { NameID, PlatformID, TtxFont } from "../open-type";
import { Names } from "./names";

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
	private _glyphs: Glyph[] = [];

	get family() { return this._family; }
	private _family: FontFamily;

	constructor (
		family: FontFamily,
		weight: FontWeight = FontWeight.Regular,
		style: FontStyle = FontStyle.Upright,
		italicAngle?: number
	) {
		this._family = family;
		this.weight = weight;
		this.style = style;
		this.italicAngle = italicAngle ?? match(style, {
			[FontStyle.Upright]: () => 0,
			[FontStyle.Italic]: () => -10,
			[FontStyle.Oblique]: () => -10,
		});
	}

	// TODO: Move to FamilyService
	static async importFromOpenType(path: string): Promise<Font> {
		const ttx = await TtxFont.fromFile(path);
		return Font.fromTtx(ttx);
	}

	// TODO: Move to FamilyService
	static fromTtx(ttx: TtxFont): Font {
		if (!ttx.namesTable)
			throw new Error("Can't import a font without names!");

		const names = new Names();
		for (let { nameID, platformID, value } of ttx.namesTable.records)
			names.add(nameID, platformID, value.trim());

		const family = new FontFamily(names.get(NameID.FontFamily)!);

		if (!ttx.head) throw new Error("TTX missing Header table!");
		family.unitsPerEm = ttx.head.unitsPerEm;

		if (ttx.os_2) {
			family.ascender = ttx.os_2.sTypoAscender;
			family.descender = ttx.os_2.sTypoDescender;
			family.xHeight = ttx.os_2.sxHeight;
			family.capHeight = ttx.os_2.sCapHeight;
		}
		else if (ttx.hhea) {
			family.ascender = ttx.hhea.ascender;
			family.descender = ttx.hhea.descender;
			family.xHeight = undefined;
			family.capHeight = undefined;
		}
		else {
			throw new Error("TTX missing OS/2 and hhea tables -- can't determine metrics!");
		}

		const result = new Font(family);

		if (ttx.glyphOrder) {
			result._glyphs.length = ttx.glyphOrder.glyphIds.length;

			for (let i = 0; i < ttx.glyphOrder.glyphIds.length; ++i) {
				const glyphId = ttx.glyphOrder.glyphIds[i];
				const glyph = new Glyph(glyphId.name, glyphId.id);

				// Find charCode
				if (ttx.cmap && ttx.cmap.maps.length) {
					const map = ttx.cmap.maps[0].value
					for (let [key, value] of map.entries()) {
						if (value === glyph.name) {
							glyph.charCode = key;
							break;
						}
					}
				}

				// Find horizontal metrics
				if (ttx.hmtx) {
					const metric = ttx.hmtx.hMetrics.get(glyph.name!);
					if (metric) {
						glyph.width = metric.width;
						glyph.lsb = metric.lsb;
					}
				}

				// Find program
				if (ttx.cffTable) {
					const charString = ttx.cffTable.cffFont.charStrings.get(glyph.name!);
					if (charString)
						glyph.program = charString.program;
				}

				result._glyphs[i] = glyph;
			}

			// Sort glyphs by character code
			result._glyphs.sort((a, b) => {
				if (a.charCode == null && b.charCode == null)
					return a.name!.localeCompare(b.name!);

				if (a.charCode == null)
					return -1;

				if (b.charCode == null)
					return 1;

				return a.charCode - b.charCode;
			})
		}

		return result;
	}
}
