import { instanceOf } from "@electric/utils";

import tauri from "../tauri.bridge";
import {
	CFFTable,
	CharToGlyphIdMappingsTable,
	FontHeaderTable,
	HorizontalHeaderTable,
	HorizontalMetricsTable,
} from "./types";
import { Xml, XmlElement } from "./types/xml";

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

	readonly head?: FontHeaderTable;
	readonly hhea?: HorizontalHeaderTable;
	readonly cmap?: CharToGlyphIdMappingsTable;
	readonly cffTable?: CFFTable;
	readonly hmtx?: HorizontalMetricsTable;

	constructor (dom: Element) {
		super(dom);
		this.head = this._children.find(instanceOf(FontHeaderTable));
		this.hhea = this._children.find(instanceOf(HorizontalHeaderTable));
		this.cmap = this._children.find(instanceOf(CharToGlyphIdMappingsTable));
		this.cffTable = this._children.find(instanceOf(CFFTable));
		this.hmtx = this._children.find(instanceOf(HorizontalMetricsTable));
	}
}
