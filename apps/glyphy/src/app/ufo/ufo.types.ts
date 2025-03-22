import { instanceOf, match, uint } from "@electric/utils";
import {  path } from "@tauri-apps/api";

import { attr, float, hex, int, Serde, str, Xml, XmlElement } from "../xml";
import { PList, plist, prop } from "../xml/plist";
import * as fs from "@tauri-apps/plugin-fs"

export enum StyleMapStyleName {
	Regular = "regular",
	Italic = "italic",
	Bold = "bold",
	BoldItalic = "bold italic",
}

@plist
export class MetaInfo extends PList {
	@prop(str) creator?: string;
	@prop(int) formatVersion!: uint;
	@prop(int) formatVersionMinor?: uint;
}

/**
 * @see https://unifiedfontobject.org/versions/ufo3/fontinfo.plist
 */
@plist
export class FontInfo extends PList {

	// Generic Identification Information
	// ==========================================================================

	/**
	 * Family name.
	 * @note The specification is agnostic about how this value relates to
	 * `openTypeNamePreferredFamilyName`.
	 */
	@prop(str) familyName!: string;

	/**
	 * Style name.
	 * @note The specification is agnostic about how this value relates to
	 * `openTypeNamePreferredSubfamilyName`.
	 */
	@prop(str) styleName!: string;

	/**
	 * Family name used for bold, italic and bold italic style mapping.
	 * @note Should be the same as `familyName`
	 */
	@prop(str) styleMapFamilyName!: string;

	/**
	 * Style map style. The possible values are `regular`, `italic`, `bold` and
	 * `bold italic`. These are case sensitive.
	 */
	@prop(str) styleMapStyleName?: StyleMapStyleName;

	/** Major version. */
	@prop(int) versionMajor?: uint;

	/** Minor version. */
	@prop(int) versionMinor?: uint;

	/**
	 * The year the font was created.
	 * @deprecated This attribute is deprecated as of version 2. Its presence
	 * should not be relied upon by authoring tools. However, it may occur in a
	 * font’s info so authoring tools should preserve it if present.
	 */
	@prop(int) year?: uint;


	// Generic Legal Information
	// ==========================================================================

	/** Copyright statement. */
	@prop(str) copyright?: string;

	/** Trademark statement. */
	@prop(str) trademark?: string;


	// Generic Dimension Information
	// ==========================================================================

	/** Units per em. */
	@prop(float) unitsPerEm!: number;

	/**
	 * Descender value.
	 * @note The specification is agnostic about the relationship to the more
	 * specific vertical metric values.
	 */
	@prop(float) descender!: number;

	/** x-height value. */
	@prop(float) xHeight?: number;

	/** Cap height value. */
	@prop(float) capHeight?: number;

	/**
	 * Ascender value.
	 * @note The specification is agnostic about the relationship to the more
	 * specific vertical metric values.
	 */
	@prop(float) ascender!: number;

	/**
	 * Italic angle. This must be an angle in counter-clockwise degrees from the
	 * vertical.
	 */
	@prop(float) italicAngle?: number;


	// Generic Miscellaneous Information
	// ==========================================================================

	/** Arbitrary note about the font. */
	@prop(str) note?: string;

	// TODO: OpenType gasp
	// TODO: Range Record
	// TODO: OpenType head
	// TODO: OpenType hhea
	// TODO: OpenType name


	// OpenType OS/2 Table
	// ==========================================================================

	/**
	 * Width class value. Must be in the range 1-9. Corresponds to the OpenType
	 * OS/2 table `usWidthClass` field.
	 */
	@prop(int) openTypeOS2WidthClass?: uint;

	/**
	 * Weight class value. Corresponds to the OpenType OS/2 table usWeightClass
	 * field.
	 */
	@prop(int) openTypeOS2WeightClass?: uint;
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace GLIF {
	@plist
	export class Contents extends PList implements Iterable<[string, string]> {
		get length() { return this.lut.size; }

		*[Symbol.iterator]() {
			for (let [key, valueNode] of this.lut)
				yield [key, valueNode.textContent!] as [string, string];
		}

		async *glifs(basePath: string): AsyncIterable<[string, Glyph]> {
			for (let [name, glyphPath] of this) {
				const fullPath = await path.join(basePath, glyphPath);
				const glyph = await Glyph.fromFile(fullPath);

				yield [name, glyph];
			}
		}

		get(key: string) {
			return this.lut.get(key)?.textContent;
		}

		set(key: string, value: string) {
			if (!this.lut.has(key)) {
				const dict = this.doc.querySelector("dict");
				if (!dict) throw new Error("Failed to find <dict> in PList document!");

				const keyNode = this.doc.createElement("key");
				keyNode.innerText = key;

				const valueNode = this.doc.createElement("string");
				valueNode.innerText = value;

				dict.appendChild(keyNode);
				dict.appendChild(valueNode);

				this.lut.set(key, valueNode);
			}
			else {
				this.lut.get(key)!.textContent = value;
			}
		}
	}

	@Xml("glyph")
	export class Glyph extends XmlElement {
		static parser = new DOMParser();

		static async fromFile(path: string): Promise<Glyph> {
			const xml = await fs.readTextFile(path);
			const doc = this.parser.parseFromString(xml, "text/xml");

			const dom = doc.querySelector("glyph");
			if (!dom) throw new Error("Expected GLIF file to have a top-level <glyph> element");

			return new Glyph(dom);
		}

		@attr(str) name!: string;
		@attr(int) format!: uint;
		@attr(int) formatMinor?: uint;

		// TODO: Should be able to create these if they don't already exist
		readonly advance?: Advance;
		readonly unicode?: Unicode;
		readonly guidelines: Guideline[];
		readonly anchors: Anchor[];
		readonly outline?: Outline;

		constructor (dom: Element) {
			super(dom);

			this.advance = this._children.find(instanceOf(Advance));
			this.unicode = this._children.find(instanceOf(Unicode));
			this.guidelines = this._children.filter(instanceOf(Guideline));
			this.anchors = this._children.filter(instanceOf(Anchor));
			this.outline = this._children.find(instanceOf(Outline));
		}
	}

	@Xml("advance")
	export class Advance extends XmlElement {
		@attr(float) width?: number;
		@attr(float) height?: number;
	}

	@Xml("unicode")
	export class Unicode extends XmlElement {
		@attr(hex) hex!: uint;
	}

	@Xml("guideline")
	export class Guideline extends XmlElement {
		@attr(float) x?: number;
		@attr(float) y?: number;
		@attr(float) angle?: number;
		@attr(str) name?: string;
		@attr(str) color?: string;
		@attr(str) identifier?: string;
	}

	@Xml("anchor")
	export class Anchor extends XmlElement {
		@attr(float) x?: number;
		@attr(float) y?: number;
		/**
		 * @see https://unifiedfontobject.org/versions/ufo3/glyphs/glif/#anchor-naming-conventions
		 */
		@attr(str) name?: string;
		@attr(str) color?: string;
		@attr(str) identifier?: string;
	}

	@Xml("outline")
	export class Outline extends XmlElement {
		components: Component[];
		contours: Contour[];

		constructor (dom: Element) {
			super(dom);

			this.components = this._children.filter(instanceOf(Component));
			this.contours = this._children.filter(instanceOf(Contour));
		}
	}

	@Xml("component")
	export class Component extends XmlElement {
		@attr(str) base?: string;
		/** @default 1 */
		@attr(float) xScale?: number;
		/** @default 0 */
		@attr(float) xyScale?: number;
		/** @default 0 */
		@attr(float) yxScale?: number;
		/** @default 1 */
		@attr(float) yScale?: number;
		/** @default 0 */
		@attr(float) xOffset?: number;
		/** @default 0 */
		@attr(float) yOffset?: number;
		@attr(str) identifier?: string;
	}

	@Xml("contour")
	export class Contour extends XmlElement {
		@attr(str) identifier?: string;
		points: Point[];

		constructor (dom: Element) {
			super(dom);
			this.points = this._children.filter(instanceOf(Point));
		}
	}

	export enum PointType {
		Move = "move",
		Line = "line",
		OffCurve = "offcurve",
		Curve = "curve",
		QCurve = "qcurve",
	}

	const bool: Serde<boolean> = class {
		static read(value: string): boolean {
			return match(value, {
				"yes": () => true,
				"no": () => false,
				_: () => false,
			});
		}
		static write(value: boolean): string {
			if (value) return "yes";
			return "no";
		}
	}

	@Xml("point")
	export class Point extends XmlElement {
		@attr(float) x!: number;
		@attr(float) y!: number;
		/** @default PointnType.OffCurve */
		@attr(str) type?: PointType;
		/** @default false */
		@attr(bool) smooth?: boolean;
		@attr(str) name?: string;
		@attr(str) identifier?: string;
	}
}
