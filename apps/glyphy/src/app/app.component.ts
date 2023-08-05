import { Component, Inject, OnInit, TrackByFunction } from "@angular/core";
import { WindowProvider, WINDOW_PROVIDER } from "@electric/platform";
import { Subject } from "rxjs";

import { Font, NewFont } from "./font";
import { Glyph } from "./glyph";
import { FamilyService, NewFontFamily } from "./family";

@Component({
	selector: "g-root",
	templateUrl: "./app.component.html",
	styleUrls: ["./app.component.scss"],
})
export class AppComponent implements OnInit {
	get maximized() { return this._win.maximized }
	set maximized(_) { this._win.toggleMaximized() }

	newFamilyDialog = false;
	openGlyphs$ = new Subject<Glyph[]>();
	activeTabIndex = 0;

	trackByUnicode: TrackByFunction<Glyph> = (_, glyph) => glyph.unicode;

	private _openGlyphsMap = new Map<Font, Glyph[]>();

	constructor (
		@Inject(WINDOW_PROVIDER) private _win: WindowProvider,
		public _familyService: FamilyService,
	) {}

	ngOnInit(): void {
		this._familyService.font$.subscribe(font => {
			this.activeTabIndex = 0;
			if (!font) return;

			// TODO: Remember the last open glyph editor for a given font
			this.openGlyphs$.next(this._openGlyphsMap.get(font) ?? []);
		});
	}

	async minimize() {
		await this._win.minimize();
	}

	async close() {
		await this._win.close();
	}

	async importFont() {
		await this._familyService.importFont();
	}

	openGlyph(glyph: Glyph): void {
		const font = this._familyService.font!;
		const openGlyphs = this._openGlyphsMap.get(font) ?? [];

		if (!this._openGlyphsMap.has(font))
			this._openGlyphsMap.set(font, openGlyphs);

		if (openGlyphs.includes(glyph)) {
			this.activeTabIndex = openGlyphs.indexOf(glyph) + 1;
		}
		else {
			openGlyphs.push(glyph);
			this.activeTabIndex = openGlyphs.length;
		}

		this.openGlyphs$.next(openGlyphs);
	}

	closeGlyph(glyphIndex: number): void {
		const openGlyphs = this._openGlyphsMap.get(this._familyService.font!)!;
		openGlyphs.splice(glyphIndex, 1);

		if (this.activeTabIndex > glyphIndex)
			this.activeTabIndex -= 1;

		this.openGlyphs$.next(openGlyphs);
	}

	async createFamily(family: NewFontFamily, fonts: NewFont[]) {
		await this._familyService.createFamily(family, fonts);
		this.newFamilyDialog = false;
	}
}
