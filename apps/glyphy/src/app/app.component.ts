import { Component, Inject, TrackByFunction } from "@angular/core";
import { WindowProvider, WINDOW_PROVIDER } from "@electric/platform";

import { NewFont } from "./font";
import { Glyph } from "./glyph";
import { FamilyService, NewFontFamily } from "./family";

@Component({
	selector: "g-root",
	templateUrl: "./app.component.html",
	styleUrls: ["./app.component.scss"],
})
export class AppComponent {
	get maximized() { return this._win.maximized }
	set maximized(_) { this._win.toggleMaximized() }

	newFamilyDialog = false;
	openGlyphs: Glyph[] = [];
	activeTabIndex = 0;

	trackByUnicode: TrackByFunction<Glyph> = (_, glyph) => glyph.unicode;

	constructor (
		@Inject(WINDOW_PROVIDER) private _win: WindowProvider,
		public _familyService: FamilyService,
	) {}

	// TODO
	ngOnInit() {
		this._familyService.family$.subscribe(family => {
			console.log(family);
		})
		this._familyService.fonts$.subscribe(fonts => {
			console.log(fonts);
		})
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
		this.openGlyphs.push(glyph);
		this.activeTabIndex = this.openGlyphs.length;
	}

	closeGlyph(glyphIndex: number): void {
		this.openGlyphs.splice(glyphIndex, 1);

		if (this.activeTabIndex > glyphIndex)
			this.activeTabIndex -= 1;
	}

	async createFamily(family: NewFontFamily, fonts: NewFont[]) {
		await this._familyService.createFamily(family, fonts);
		this.newFamilyDialog = false;
	}
}
