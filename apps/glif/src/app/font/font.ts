import { Const } from "@electric/utils";
import { Glyph } from "../glyph";
import { NameID, PlatformID, TtxFont } from "../open-type";
import { Names } from "./names";

export { NameID, PlatformID };

export interface Metrics {
	unitsPerEm: number;

	xMin: number;
	xMax: number;

	yMin: number;
	yMax: number;

	ascender?: number;
	descender?: number;
	xHeight?: number;
	capHeight?: number;
}

export class Font {
	readonly names = new Names();

	get metrics(): Const<Metrics> { return this._metrics; }
	private _metrics!: Metrics;

	get glyphs(): readonly Glyph[] { return this._glyphs; }
	private _glyphs: Glyph[] = [];

	static async importFromOpenType(path: string): Promise<Font> {
		const ttx = await TtxFont.fromFile(path);
		return Font.fromTtx(ttx);
	}

	static fromTtx(ttx: TtxFont): Font {
		const result = new Font();

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

		// Construct user-friendly names lookup
		if (ttx.namesTable)
			for (let { nameID, platformID, value } of ttx.namesTable.records)
				result.names.add(nameID, platformID, value.trim());

		const metrics = {} as Partial<Metrics>;

		if (!ttx.head) throw new Error("TTX missing Header table!");
		metrics.unitsPerEm = ttx.head.unitsPerEm;
		metrics.xMin = ttx.head.xMin;
		metrics.xMax = ttx.head.xMax;
		metrics.yMin = ttx.head.yMin;
		metrics.yMax = ttx.head.yMax;

		if (ttx.os_2) {
			metrics.ascender = ttx.os_2.sTypoAscender;
			metrics.descender = ttx.os_2.sTypoDescender;
			metrics.xHeight = ttx.os_2.sxHeight;
			metrics.capHeight = ttx.os_2.sCapHeight;
		}
		else if (ttx.hhea) {
			metrics.ascender = ttx.hhea.ascender;
			metrics.descender = ttx.hhea.descender;
		}

		result._metrics = metrics as Metrics;

		return result;
	}
}
