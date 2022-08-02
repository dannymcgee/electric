import { ChangeDetectorRef, Component, Inject, Pipe, PipeTransform } from "@angular/core";
import { SafeHtml } from "@angular/platform-browser";
import { WindowProvider, WINDOW_PROVIDER } from "@electric/platform";
import * as dialog from "@tauri-apps/api/dialog";

import { CharString, Font } from "./font";
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
				<pre class="glyph__program"
					[name]="glyph.name"
					[gInterpreter]="glyph.charString.program"
					[innerHtml]="glyph.charString.program | program"
				></pre>
				<div class="glyph__label">{{ glyph.name }}</div>
			</div>
		</div>

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

	glyphs: Array<{ name: string, charString: CharString }> = [];

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

				this.glyphs = fonts.flatMap(font =>
					font.cffTable?.cffFont.charStrings
						? Array
							.from(font.cffTable.cffFont.charStrings.entries())
							.map(([name, charString]) => ({ name, charString }))
						: []
				);
			}
			else {
				const font = await Font.fromFile(result);
				console.log(font);

				this.glyphs = font.cffTable?.cffFont.charStrings
					? Array
						.from(font.cffTable.cffFont.charStrings.entries())
						.map(([name, charString]) => ({ name, charString }))
					: [];

				console.log("glyphs:", this.glyphs);
				this._cdRef.detectChanges();
			}
		}
		catch (err) {
			console.error(err);
		}
	}
}

@Pipe({ name: "program" })
export class CffProgramPipe implements PipeTransform {
	transform(value: string): SafeHtml {
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
