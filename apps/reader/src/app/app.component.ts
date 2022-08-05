import { Component, Inject, OnDestroy } from "@angular/core";
import { WindowProvider, WINDOW_PROVIDER } from "@electric/platform";
import { BehaviorSubject } from "rxjs";

import { Book, Library } from "./library.service";

@Component({
	selector: "r-root",
	template: `

<elx-app-shell
	fakeWindowsChrome
	[maximized]="maximized"
>
	<elx-titlebar
		title="Reader"
		(minimize)="minimize()"
		[(maximized)]="maximized"
		(close)="close()"
	>
		<img *elxTitlebarIcon
			src="assets/favicon.ico"
			alt="Reader Favicon"
		/>

		<elx-menubar>
			<elx-menuitem [elxMenuTriggerFor]="fileMenu">
				File
			</elx-menuitem>
		</elx-menubar>

		<elx-menu #fileMenu>
			<elx-menuitem icon="FolderOpen"
				(click)="importBook()"
			>
				Import EPUB...
			</elx-menuitem>
		</elx-menu>
	</elx-titlebar>

	<elx-main-viewport class="main">

		<section class="books"
			*ngIf="(books$ | async) as books"
		>
			<button class="book"
				*ngFor="let book of books"
				[style.background-image]="'url(' +  book.coverUrl + ')'"
				[attr.aria-label]="book.title"
				(click)="openReader(book)"
			></button>
		</section>

		<r-book-reader class="reader"
			*ngIf="(activeBook$ | async) as activeBook"
			[id]="activeBook.id"
			(close)="closeBook()"
		></r-book-reader>

	</elx-main-viewport>
</elx-app-shell>

	`,
	styleUrls: ["./app.component.scss"],
})
export class AppComponent implements OnDestroy {
	get maximized() { return this._win.maximized }
	set maximized(_) { this._win.toggleMaximized() }

	get books$() { return this._library.books$; }

	private _activeBook$ = new BehaviorSubject<Book | null>(null);
	get activeBook$() { return this._activeBook$.asObservable(); }

	constructor (
		private _library: Library,
		@Inject(WINDOW_PROVIDER) private _win: WindowProvider,
	) {}

	ngOnDestroy(): void {
		this._activeBook$.complete();
	}

	async minimize() {
		await this._win.minimize();
	}

	async close() {
		await this._win.close();
	}

	openReader(book: Book): void {
		this._activeBook$.next(book);
	}

	closeBook(): void {
		this._activeBook$.next(null);
	}

	async importBook() {
		try {
			await this._library.importBook();
		}
		catch (err) {
			console.error(err);
		}
	}
}
