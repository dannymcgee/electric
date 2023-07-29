import { ChangeDetectorRef, Component, Inject, Pipe, PipeTransform } from "@angular/core";
import { SafeHtml } from "@angular/platform-browser";
import { WindowProvider, WINDOW_PROVIDER } from "@electric/platform";
import * as dialog from "@tauri-apps/api/dialog";

import { Font, FontProvider, fontProviderFactory, NameID } from "./font";
import { Glyph } from "./glyph";
import { ProjectService } from "./project.service";

@Component({
	selector: "g-root",
	template: `

<elx-app-shell
	fakeWindowsChrome
	[maximized]="maximized"
>
	<elx-titlebar
		(minimize)="minimize()"
		[(maximized)]="maximized"
		(close)="close()"
	>
		<img *elxTitlebarIcon
			src="assets/favicon.ico"
			alt="Glif Favicon"
		/>

		<elx-menubar>
			<elx-menuitem [elxMenuTriggerFor]="fileMenu">
				File
			</elx-menuitem>
			<elx-menuitem disabled>
				Edit
			</elx-menuitem>
			<elx-menuitem disabled>
				Help
			</elx-menuitem>
		</elx-menubar>

		<div class="title" elxTitlebarTitle>
			<span class="title__app">Glif</span>
			<ng-container *ngIf="(_project.name$ | async) as projectName">
				<em class="title__sep">/</em>
				<span class="title__project">{{ projectName }}</span>
			</ng-container>
			<ng-container *ngIf="fontName">
				<em class="title__sep">/</em>
				<span class="title__project">{{ fontName }}</span>
			</ng-container>
		</div>
	</elx-titlebar>

	<elx-menu #fileMenu>
		<elx-menuitem icon="NewFolder" keybind="Ctrl + N"
			(click)="_project.create()"
		>
			New Project...
		</elx-menuitem>
		<elx-menuitem icon="FolderOpen" keybind="Ctrl + O"
			(click)="_project.open()"
		>
			Open Project...
		</elx-menuitem>
		<elx-menuitem disabled>
			Recent Projects
		</elx-menuitem> <!-- TODO -->
		<hr />
		<!-- [disabled]="!(_project.home$ | async)" -->
		<elx-menuitem (click)="importFont()">
			Import Font...
		</elx-menuitem>
	</elx-menu>

	<elx-main-viewport class="main">
		<div *ngIf="glyphs.length else getStarted"
			class="glyphs"
		>
			<div *ngFor="let glyph of glyphs"
				class="glyph"
			>
				<svg g-glyph class="glyph__svg"
					[glyph]="glyph"
				/>
				<div role="button" class="glyph__label"
					(click)="setActiveGlyph(glyph)"
				>
					<strong class="glyph__name">{{ glyph.name }}</strong>
					<span *ngIf="glyph.charCode"
						class="glyph__char-code"
					>{{ glyph.charCode | hex }}</span>
				</div>
			</div>
		</div>

		<elx-dialog class="active-glyph__dialog"
			#activeGlyphDialog
			*elxDialogTrigger="activeGlyph"
			blocking
			(close)="setActiveGlyph(undefined)"
		>
			<elx-dialog-heading>
				{{ activeGlyph?.name ?? "" }}
			</elx-dialog-heading>

			<svg g-glyph-editor class="active-glyph__svg"
				[glyph]="activeGlyph!"
			/>

			<elx-dialog-footer>
				<button elx-btn
					(click)="activeGlyphDialog.close()"
				>
					Cancel
				</button>
				<button elx-btn="primary"
					(click)="activeGlyphDialog.close()"
				>
					Save
				</button>
			</elx-dialog-footer>
		</elx-dialog>

		<ng-template #getStarted>
			<button elx-btn="primary"
				(click)="importFont()"
			>
				Get Started
			</button>
		</ng-template>

	</elx-main-viewport>
</elx-app-shell>

	`,
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

@Pipe({ name: "program" })
export class CffProgramPipe implements PipeTransform {
	transform(value: string | undefined): SafeHtml {
		if (!value) return "";

		return value
			.split("\n")
			.map(line => line.trim())
			.filter(Boolean)
			.map(line => line
				.split(/ +/)
				.map(token => {
					if (/^[-.0-9]+$/.test(token))
						return `<span class="numeric">${token}</span>`;
					return `<span class="instr">${token}</span>`;
				})
				.join(" ")
			)
			.join("\n");
	}
}

@Pipe({ name: "hex" })
export class HexPipe implements PipeTransform {
	transform(value: number | undefined): string {
		if (value == null) return "";

		let result = value.toString(16).toUpperCase();
		while (result.length % 2)
			result = "0" + result;

		return result;
	}
}

@Pipe({ name: "svg" })
export class GlyphToSvgPipe implements PipeTransform {
	transform(glyph: Glyph | undefined) {
		if (!glyph) return "";
		return glyph.toString();
	}
}
