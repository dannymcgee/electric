import { instanceOf } from "@electric/utils";

import tauri from "../tauri.bridge";
import { Xml, XmlElement } from "../xml";
import {
	CFFTable,
	CharToGlyphIdMappingsTable,
	FontHeaderTable,
	GlyphOrderTable,
	HorizontalHeaderTable,
	HorizontalMetricsTable,
	NamesTable,
	OS2Table,
} from "./open-type.types";

@Xml("ttFont")
export class TtxFont extends XmlElement {
	static parser = new DOMParser();

	static async fromFile(path: string): Promise<TtxFont> {
		const xml = await tauri.parseFontToXml(path);
		const doc = TtxFont.parser.parseFromString(xml, "text/xml");
		console.log(doc);

		const element = doc.querySelector("ttFont");
		if (!element) throw new Error("Expected document > ttFont element");

		return new TtxFont(element);
	}

	readonly glyphOrder?: GlyphOrderTable;
	readonly head?: FontHeaderTable;
	readonly hhea?: HorizontalHeaderTable;
	readonly namesTable?: NamesTable;
	readonly os_2?: OS2Table;
	readonly cmap?: CharToGlyphIdMappingsTable;
	readonly cffTable?: CFFTable;
	readonly hmtx?: HorizontalMetricsTable;

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
	}
}
