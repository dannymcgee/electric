import { ChangeDetectorRef, Component, Inject } from "@angular/core";
import { WindowProvider, WINDOW_PROVIDER } from "@electric/platform";
import * as dialog from "@tauri-apps/api/dialog";

import { Font, FontProvider, fontProviderFactory, NameID } from "./font";
import { Glyph } from "./glyph";
import { ProjectService } from "./project.service";

@Component({
	selector: "g-root",
	templateUrl: "./app.component.html",
	styleUrls: ["./app.component.scss"],
	providers: [{
		provide: Font,
		useFactory: fontProviderFactory,
		deps: [AppComponent],
	}]
})
export class AppComponent implements FontProvider {
	get maximized() { return this._win.maximized }
	set maximized(_) { this._win.toggleMaximized() }

	glyphs: readonly Glyph[] = [];
	activeGlyph?: Glyph;

	font?: Font;
	fontName?: string;

	constructor (
		private _cdRef: ChangeDetectorRef,
		@Inject(WINDOW_PROVIDER) private _win: WindowProvider,
		public _project: ProjectService,
	) {}

	async minimize() {
		await this._win.minimize();
	}

	async close() {
		await this._win.close();
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

			if (Array.isArray(result)) {
				const fonts = await Promise.all(result.map(Font.fromFile));
				for (let font of fonts)
					console.log(font);

				this.glyphs = fonts.flatMap(font => font.glyphs);
				console.log("glyphs:", this.glyphs);

				if (fonts.length === 1) {
					this.font = fonts[0];
					this.fontName = this.font.names.get(NameID.FullName);
				}
				else if (fonts.length)
					console.warn("WARNING: Multiple fonts loaded!");

				this._cdRef.detectChanges();
			}
			else {
				const font = await Font.fromFile(result);
				console.log(font);

				this.glyphs = font.glyphs;
				console.log("glyphs:", this.glyphs);

				this.font = font;
				this.fontName = this.font.names.get(NameID.FullName);

				this._cdRef.detectChanges();
			}
		}
		catch (err) {
			console.error(err);
		}
	}

	setActiveGlyph(glyph?: Glyph): void {
		this.activeGlyph = glyph;
		console.log("active glyph:", glyph);
		this._cdRef.markForCheck();
	}
}
