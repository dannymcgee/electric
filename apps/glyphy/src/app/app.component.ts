import { Component, inject, OnDestroy, OnInit } from "@angular/core";
import { GlobalFocusManager } from "@electric/ng-utils";
import { WINDOW_PROVIDER } from "@electric/platform";
import { filter, Subject, takeUntil } from "rxjs";

import { Font, NewFont } from "./font";
import { Glyph } from "./glyph";
import { FamilyService, NewFontFamily } from "./family";

@Component({
	selector: "g-root",
	templateUrl: "./app.component.html",
	styleUrls: ["./app.component.scss"],
	standalone: false,
})
export class AppComponent implements OnInit, OnDestroy {
	get maximized() { return this._win.maximized }
	set maximized(_) { this._win.toggleMaximized() }

	newFamilyDialog = false;
	openGlyphs$ = new Subject<Glyph[]>();
	activeTabIndex = 0;

	private _openGlyphsMap = new Map<Font, Glyph[]>();
	private _onDestroy$ = new Subject<void>();

	private _win = inject(WINDOW_PROVIDER);
	_familyService = inject(FamilyService);
	private _focusManager = inject(GlobalFocusManager);

	ngOnInit(): void {
		this._familyService.font$
			.pipe(takeUntil(this._onDestroy$))
			.subscribe(font => {
				this.activeTabIndex = 0;
				if (!font) return;

				// TODO: Remember the last open glyph editor for a given font
				this.openGlyphs$.next(this._openGlyphsMap.get(font) ?? []);
			});

		this._focusManager.activeElement$
			.pipe(
				filter(activeElement => activeElement === document.body),
				takeUntil(this._onDestroy$),
			)
			.subscribe(() => {
				this._focusManager.getLastValidFocusTarget()?.focus();
			});
	}

	ngOnDestroy(): void {
		this._onDestroy$.next();
		this._onDestroy$.complete();
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

		this.activeTabIndex = openGlyphs.includes(glyph)
			? openGlyphs.indexOf(glyph) + 1
			: openGlyphs.push(glyph);

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
