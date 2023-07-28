import { instanceOf } from "@electric/utils";
import { Glyph } from "../glyph";

import tauri from "../tauri.bridge";
import {
	CFFTable,
	CharToGlyphIdMappingsTable,
	FontHeaderTable,
	GlyphOrderTable,
	HorizontalHeaderTable,
	HorizontalMetricsTable,
	NameID,
	NamesTable,
	OS2Table,
	PlatformID,
} from "./types";
import { Xml, XmlElement } from "./types/xml";

export { NameID, PlatformID };

// TODO: Move this somewhere else
export class Names {
	private _map = new Map<NameID, Name>();

	add(name: NameID, platform: PlatformID, value: string): void {
		if (!this._map.has(name))
			this._map.set(name, new Name())

		this._map.get(name)!.add(platform, value);
	}

	get(name: NameID, platform?: PlatformID): string | undefined {
		return this._map.get(name)?.get(platform);
	}
}

export class Name {
	private _map = new Map<PlatformID, string>();

	add(id: PlatformID, value: string): void {
		this._map.set(id, value);
	}

	get(id?: PlatformID): string | undefined {
		if (id) return this._map.get(id);
		return [...this._map.values()][0];
	}
}

@Xml("ttFont")
export class Font extends XmlElement {
	static parser = new DOMParser();

	static async fromFile(path: string): Promise<Font> {
		const xml = await tauri.parseFontToXml(path);
		const doc = Font.parser.parseFromString(xml, "text/xml");
		console.log(doc);

		const element = doc.querySelector("ttFont");
		if (!element) throw new Error("Expected document > ttFont element");

		return new Font(element);
	}

	readonly names = new Names();

	readonly glyphOrder?: GlyphOrderTable;
	readonly head?: FontHeaderTable;
	readonly hhea?: HorizontalHeaderTable;
	readonly namesTable?: NamesTable;
	readonly os_2?: OS2Table;
	readonly cmap?: CharToGlyphIdMappingsTable;
	readonly cffTable?: CFFTable;
	readonly hmtx?: HorizontalMetricsTable;

	private _glyphs: Glyph[] = [];
	get glyphs(): readonly Glyph[] { return this._glyphs; }

	constructor (dom: Element) {
		super(dom);
		this.glyphOrder = this._children.find(instanceOf(GlyphOrderTable));
		this.head = this._children.find(instanceOf(FontHeaderTable));
		this.hhea = this._children.find(instanceOf(HorizontalHeaderTable));
		this.namesTable = this._children.find(instanceOf(NamesTable));
		this.os_2 = this._children.find(instanceOf(OS2Table));
		this.cmap = this._children.find(instanceOf(CharToGlyphIdMappingsTable));
		this.cffTable = this._children.find(instanceOf(CFFTable));
		this.hmtx = this._children.find(instanceOf(HorizontalMetricsTable));

		if (this.glyphOrder) {
			this._glyphs.length = this.glyphOrder.glyphIds.length;

			for (let i = 0; i < this.glyphOrder.glyphIds.length; ++i) {
				const glyphId = this.glyphOrder.glyphIds[i];
				const glyph = new Glyph(glyphId.name, glyphId.id);

				// Find charCode
				if (this.cmap && this.cmap.maps.length) {
					const map = this.cmap.maps[0].value
					for (let [key, value] of map.entries()) {
						if (value === glyph.name) {
							glyph.charCode = key;
							break;
						}
					}
				}

				// Find horizontal metrics
				if (this.hmtx) {
					const metric = this.hmtx.hMetrics.get(glyph.name!);
					if (metric) {
						glyph.width = metric.width;
						glyph.lsb = metric.lsb;
					}
				}

				// Find program
				if (this.cffTable) {
					const charString = this.cffTable.cffFont.charStrings.get(glyph.name!);
					if (charString)
						glyph.program = charString.program;
				}

				this._glyphs[i] = glyph;
			}

			// Sort glyphs by character code
			this._glyphs.sort((a, b) => {
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
		if (this.namesTable)
			for (let { nameID, platformID, value } of this.namesTable.records)
				this.names.add(nameID, platformID, value.trim());
	}
}
