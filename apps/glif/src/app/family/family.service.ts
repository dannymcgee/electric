import { Injectable, OnDestroy } from "@angular/core";
import { match } from "@electric/utils";
import * as dialog from "@tauri-apps/api/dialog";
import * as fs from "@tauri-apps/api/fs";
import * as path from "@tauri-apps/api/path";
import { BehaviorSubject, Observable } from "rxjs";

import tauri from "../tauri.bridge";
import { FontInfo, MetaInfo, StyleMapStyleName } from "../ufo/ufo.types";
import { newPList, readPList } from "../xml/plist";
import { defaultMetrics, FontFamily, FontMetrics, NewFontFamily } from "./family.types";
import { Font, FontStyle, FontWeight, Names, NewFont } from "../font";
import { FsSelectionFlags, MacStyleFlags, NameID, TtxFont } from "../open-type";
import { Glyph } from "../glyph";

export type Path = string;

interface FamilyManifest {
	familyName: string;
	fonts: string[];
	metrics: FontMetrics;
}

@Injectable({
	providedIn: "root",
})
export class FamilyService implements OnDestroy {
	get family$() { return this._family$.asObservable(); }
	get family() { return this._family$.value; }
	private _family$ = new BehaviorSubject<FontFamily | null>(null);

	get fonts$() { return this._fonts$.asObservable() as Observable<readonly Font[]>; }
	get fonts() { return this._fonts$.value as readonly Font[]; }
	private _fonts$ = new BehaviorSubject<Font[]>([]);

	get font$() { return this._font$.asObservable(); }
	get font() { return this._font$.value; }
	private _font$ = new BehaviorSubject<Font | null>(null);

	ngOnDestroy(): void {
		this._family$.complete();
	}

	async createFamily(newFamily: NewFontFamily, newFonts: NewFont[] = []) {
		if (!(await tauri.pathExists(newFamily.directory)))
			await fs.createDir(newFamily.directory);

		const metrics = defaultMetrics();
		const family = new FontFamily(newFamily.name, metrics);
		const fonts = newFonts.map(font => new Font(family, font.weight, font.style as FontStyle));

		const manifest: FamilyManifest = {
			familyName: family.name,
			fonts: fonts.map(font => `${font.postScriptName}.ufo`),
			metrics,
		};

		const manifestPath = await path.join(newFamily.directory, "manifest.json");
		await fs.writeTextFile(manifestPath, JSON.stringify(manifest, null, "\t"));

		for (let font of fonts) {
			const fontPath = await path.join(newFamily.directory, `${font.postScriptName}.ufo`);
			await this.createFont(font, fontPath);
		}

		this._family$.next(family);
		this._fonts$.next(fonts);
		this._font$.next(fonts[0] ?? null);
	}

	async createFont(font: Font, dir: string) {
		await fs.createDir(dir);

		const metaInfo = await newPList(MetaInfo, "metainfo.plist", dir);
		metaInfo.creator = "dev.dannymcgee.glyphy";
		metaInfo.formatVersion = 3;
		await metaInfo.save();

		const fontInfo = await newPList(FontInfo, "fontinfo.plist", dir);
		fontInfo.familyName = font.family.name;
		fontInfo.styleName = font.styleName;
		fontInfo.styleMapFamilyName = font.family.name;

		const styleName: StyleMapStyleName|null = match(font.weight, {
			[FontWeight.Regular]: () => match(font.style, {
				[FontStyle.Upright]: () => StyleMapStyleName.Regular,
				[FontStyle.Italic]: () => StyleMapStyleName.Italic,
				[FontStyle.Oblique]: () => StyleMapStyleName.Italic,
			}),
			[FontWeight.Bold]: () => match(font.style, {
				[FontStyle.Upright]: () => StyleMapStyleName.Bold,
				[FontStyle.Italic]: () => StyleMapStyleName.BoldItalic,
				[FontStyle.Oblique]: () => StyleMapStyleName.BoldItalic,
			}),
			_: () => null,
		});
		if (styleName)
			fontInfo.styleMapStyleName = styleName;

		fontInfo.versionMajor = 1;
		fontInfo.versionMinor = 0;

		fontInfo.unitsPerEm = font.unitsPerEm;
		fontInfo.descender = font.descender;
		fontInfo.xHeight = font.xHeight;
		fontInfo.capHeight = font.capHeight;
		fontInfo.ascender = font.ascender;
		fontInfo.italicAngle = font.italicAngle;
		fontInfo.openTypeOS2WeightClass = font.weight;

		fontInfo.save();
	}

	async open() {
		const pathname = await dialog.open({
			directory: true,
			multiple: false,
		}) as string | null;

		if (!pathname) return;

		const manifestPath = await path.join(pathname, "manifest.json");
		if (!(await tauri.pathExists(manifestPath))) {
			console.error(`"${manifestPath}" not found!`) // TODO: User-facing error
			return;
		}

		const manifestJson = await fs.readTextFile(manifestPath);
		const manifest = JSON.parse(manifestJson) as FamilyManifest;

		const family = new FontFamily(manifest.familyName, manifest.metrics);
		const fonts: Font[] = [];

		for (let pkgName of manifest.fonts) {
			const fontPath = await path.join(pathname, pkgName);
			const fontInfoPath = await path.join(fontPath, "fontinfo.plist");
			if (!(await tauri.pathExists(fontInfoPath))) {
				console.error(`Unable to process font without "fontinfo.plist"`) // TODO: User-facing error
				continue;
			}
			const fontInfo = await readPList(FontInfo, fontInfoPath);
			const weight = (fontInfo.openTypeOS2WeightClass ?? FontWeight.Regular) as FontWeight;
			const style = (fontInfo.styleName?.split(" ")[1] ?? FontStyle.Upright) as FontStyle;

			fonts.push(new Font(family, weight, style));
		}

		// TODO: Load glyphs

		this._family$.next(family);
		this._fonts$.next(fonts);
		this._font$.next(fonts[0] ?? null);
	}

	async importFont() {
		try {
			const result = await dialog.open({
				title: "Import Font(s)",
				directory: false,
				multiple: true,
				filters: [{
					name: "Font Files",
					extensions: ["otf", "ttf"],
				}],
			});

			if (!result) return;

			const fonts = Array.isArray(result)
				? await Promise.all(result.map(it => this.importFromOpenType(it)))
				: [await this.importFromOpenType(result)];

			if (!this._fonts$.value.length) {
				this._fonts$.next(fonts);
				this._font$.next(fonts[0] ?? null);
			}
			else {
				const updated = this.mergeFonts(this._fonts$.value, fonts);
				this._fonts$.next(updated);
			}
		}
		catch (err) {
			console.error(err);
		}
	}

	setActive(font: Font) {
		this._font$.next(font);
	}

	private mergeFonts(dest: readonly Font[], src: readonly Font[]): Font[] {
		const result: Font[] = [];
		const ids = new Set<string>();

		const addFont = (font: Font) => {
			if (!ids.has(font.postScriptName)) {
				ids.add(font.postScriptName);
				result.push(font);
			}
			else {
				// TODO
				console.warn(`Existing font ${font.postScriptName} conflicts with import -- skipping`);
			}
		}

		dest.forEach(addFont);
		src.forEach(addFont);

		result.sort((a, b) => {
			if (a.weight !== b.weight)
				return a.weight - b.weight;

			if (a.style === FontStyle.Upright)
				return -1;

			return 1;
		});

		return result;
	}

	private async importFromOpenType(otfPath: string): Promise<Font> {
		const ttx = await TtxFont.fromFile(otfPath);
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

		if (!this._family$.value)
			this._family$.next(family);
		else {
			// TODO: Check if we can merge into active family
		}

		// TODO: Yikes
		const weight = ttx.os_2?.usWeightClass
			?? (ttx.cffTable?.cffFont?.weight
					? FontWeight[ttx.cffTable.cffFont.weight as keyof typeof FontWeight]
					: undefined)
			?? (ttx.head?.macStyle != null
					? ((ttx.head.macStyle & MacStyleFlags.Bold)
						? FontWeight.Bold
						: FontWeight.Regular)
					: FontWeight.Regular
				);

		// TODO: Yikes
		const style
			= (ttx.os_2?.fsSelection != null)
			? ((ttx.os_2.fsSelection & FsSelectionFlags.Italic)
				? FontStyle.Italic
				: (ttx.os_2.fsSelection & FsSelectionFlags.Oblique)
					? FontStyle.Oblique
					: FontStyle.Upright)
			: (ttx.head?.macStyle != null)
			? ((ttx.head.macStyle & MacStyleFlags.Italic)
				? FontStyle.Italic
				: FontStyle.Upright)
			: FontStyle.Upright;

		const italicAngle = ttx.cffTable?.cffFont?.italicAngle ?? ttx.post?.italicAngle;

		const result = new Font(family, weight, style, italicAngle);

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
					// TODO: Remove `program` from Glyph, interpret here
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
			});
		}

		return result;
	}
}
