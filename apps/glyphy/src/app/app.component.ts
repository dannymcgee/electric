import { ChangeDetectorRef, Component, Inject } from "@angular/core";
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

	setActiveGlyph(glyph?: Glyph): void {
		// FIXME
		// this.activeGlyph = glyph;
		// console.log("active glyph:", glyph);
		// this._cdRef.markForCheck();
	}

	async createFamily(family: NewFontFamily, fonts: NewFont[]) {
		await this._familyService.createFamily(family, fonts);
		this.newFamilyDialog = false;
	}
}
