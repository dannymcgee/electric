import { ChangeDetectorRef, Component, Inject, Pipe, PipeTransform } from "@angular/core";
import { SafeHtml } from "@angular/platform-browser";
import { WindowProvider, WINDOW_PROVIDER } from "@electric/platform";
import * as dialog from "@tauri-apps/api/dialog";
import * as d3 from "d3";

import { Font, NameID } from "./font";
import { Glyph, Interpreter } from "./glyph";
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
				<svg class="glyph__svg"
					*elxUnwrap="(font | svgViewBox : glyph) as viewBox"
					[attr.viewBox]="viewBox"
					preserveAspectRatio="xMidyMid meet"
					fill="currentColor"
				>
					<g class="glyph__metrics">
						<line class="glyph__baseline"
							x1="-10000" y1="0"
							x2="10000" y2="0"
						/>
						<line class="glyph__left"
							x1="0" y1="-10000"
							x2="0" y2="10000"
						/>
						<line class="glyph__right"
							[attr.x1]="glyph.width" y1="-10000"
							[attr.x2]="glyph.width" y2="10000"
						/>
						<line class="glyph__xheight"
							x1="-10000" [attr.y1]="font?.os_2?.sxHeight"
							x2="10000" [attr.y2]="font?.os_2?.sxHeight"
						/>
						<line class="glyph__cap"
							x1="-10000" [attr.y1]="font?.os_2?.sCapHeight"
							x2="10000" [attr.y2]="font?.os_2?.sCapHeight"
						/>
						<line class="glyph__asc"
							x1="-10000" [attr.y1]="font?.os_2?.sTypoAscender"
							x2="10000" [attr.y2]="font?.os_2?.sTypoAscender"
						/>
						<line class="glyph__dsc"
							x1="-10000" [attr.y1]="font?.os_2?.sTypoDescender"
							x2="10000" [attr.y2]="font?.os_2?.sTypoDescender"
						/>
					</g>
					<path [attr.d]="glyph.program | svg : viewBox" />
				</svg>
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
			<svg class="active-glyph__svg"
				*elxUnwrap="(font | svgViewBox : activeGlyph) as viewBox"
				[attr.viewBox]="viewBox"
			>
				<g class="glyph__metrics active-glyph__metrics">
					<line class="glyph__baseline active-glyph__baseline"
						x1="-10000" y1="0"
						x2="10000" y2="0"
					/>
					<line class="glyph__left active-glyph__left"
						x1="0" y1="-10000"
						x2="0" y2="10000"
					/>
					<line class="glyph__right active-glyph__right"
						[attr.x1]="activeGlyph?.width" y1="-10000"
						[attr.x2]="activeGlyph?.width" y2="10000"
					/>
					<line class="glyph__xheight active-glyph__xheight"
						x1="-10000" [attr.y1]="font?.os_2?.sxHeight"
						x2="10000" [attr.y2]="font?.os_2?.sxHeight"
					/>
					<line class="glyph__cap active-glyph__cap"
						x1="-10000" [attr.y1]="font?.os_2?.sCapHeight"
						x2="10000" [attr.y2]="font?.os_2?.sCapHeight"
					/>
					<line class="glyph__asc active-glyph__asc"
						x1="-10000" [attr.y1]="font?.os_2?.sTypoAscender"
						x2="10000" [attr.y2]="font?.os_2?.sTypoAscender"
					/>
					<line class="glyph__dsc active-glyph__dsc"
						x1="-10000" [attr.y1]="font?.os_2?.sTypoDescender"
						x2="10000" [attr.y2]="font?.os_2?.sTypoDescender"
					/>
				</g>
				<path [attr.d]="activeGlyph?.program | svg : viewBox" />
			</svg>
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
})
export class AppComponent {
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
	transform(program: string | undefined, viewBox: string | undefined) {
		if (!program || !viewBox) return;

		const vm = new Interpreter(program);
		vm.exec();

		const d3Path = d3.path();
		vm.path.replay(d3Path);

		return d3Path.toString();
	}
}

@Pipe({ name: "svgViewBox" })
export class FontToSvgViewBoxPipe implements PipeTransform {
	transform(font?: Font, glyph?: Glyph): string {
		if (!font?.head || !glyph) return "0 0 1000 1000";

		const { xMin, yMin, yMax } = font.head;
		const { width } = glyph;
		const height = yMax - yMin;

		return `${xMin} ${yMin} ${width} ${height}`
	}
}
