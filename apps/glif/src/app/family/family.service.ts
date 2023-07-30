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
import { Font, FontStyle, FontWeight, NewFont } from "../font";

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

	setActive(font: Font) {
		this._font$.next(font);
	}
}
