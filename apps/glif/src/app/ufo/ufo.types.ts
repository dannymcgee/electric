import { uint } from "@electric/utils";

import { float, int, str } from "../xml";
import { PList, plist, prop } from "../xml/plist";

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
