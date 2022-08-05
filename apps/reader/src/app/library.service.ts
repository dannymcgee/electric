import { Injectable, OnDestroy } from "@angular/core";
import { isNotNull } from "@electric/utils";
import { dialog, fs, path } from "@tauri-apps/api";
import { BehaviorSubject } from "rxjs";

import bridge from "./tauri.bridge";

export interface Book {
	id: string;
	title: string;
	author: string;
	coverUrl: string;
	rootDir: string;
	packageDir: string;
	packageDoc: Document;
	manifest: Element;
	spine: Element;
}

@Injectable({
	providedIn: "root",
})
export class Library implements OnDestroy {
	private _data$ = new BehaviorSubject<Book[]>([]);
	private _parser = new DOMParser();

	get books$() { return this._data$.asObservable(); }

	constructor () {
		this.init();
	}

	ngOnDestroy(): void {
		this._data$.complete();
	}

	private async init() {
		const libDir = await path.appDir();
		const books = (await Promise.all(
			(await fs.readDir(libDir))
				.map(ent => ent.path)
				.map(async bookPath => {
					if (await bridge.isDirectory(bookPath))
						return this.readBookMeta(bookPath);
					return null;
				})
		)).filter(isNotNull);

		books.sort((a, b) =>
			a.author.localeCompare(b.author)
			|| a.title.localeCompare(b.title)
		);

		console.log(books)

		this._data$.next(books);
	}

	getById(id: string): Book | undefined {
		return this._data$.value.find(book => book.id === id);
	}

	async importBook(): Promise<Book | null> {
		const input = await dialog.open({
			title: "Import EPUB",
			directory: false,
			multiple: false,
			filters: [{
				name: "EPUB",
				extensions: ["epub"],
			}],
		}) as string | null;

		if (!input) return null;

		const bookPath = await bridge.importBook(input);
		const result = await this.readBookMeta(bookPath);

		let insertionIdx: number | undefined;
		for (let i = 0; i < this._data$.value.length; ++i) {
			const book = this._data$.value[i];
			const sortValue = result.author.localeCompare(book.author)
				|| result.title.localeCompare(book.title);

			if (sortValue < 0) {
				insertionIdx = i;
				break;
			}
		}

		if (insertionIdx === undefined) {
			this._data$.next(this._data$.value.concat(result));
		} else {
			this._data$.next(
				this._data$.value
					.slice(0, insertionIdx)
					.concat(
						result,
						this._data$.value.slice(insertionIdx),
					),
			);
		}

		return result;
	}

	async readBookMeta(bookPath: string): Promise<Book> {
		const containerPath = await path.join(bookPath, "META-INF", "container.xml");
		const containerContent = await fs.readTextFile(containerPath);
		const container = this._parser.parseFromString(containerContent, "text/xml");

		const packagePath = await path.join(
			bookPath,
			...container
				.querySelector("rootfiles > rootfile")!
				.getAttribute("full-path")!
				.split(/[\/\\]/)
		);
		const packageDir = await path.dirname(packagePath);
		const packageContent = await fs.readTextFile(packagePath);
		const packageDoc = this._parser.parseFromString(packageContent, "text/xml");

		const id = packageDoc
			.querySelector("package > metadata > *|identifier")!
			.textContent!
			.trim();

		const title = packageDoc
			.querySelector("package > metadata > *|title")!
			.textContent!
			.trim();

		const author = packageDoc
			.querySelector("package > metadata > *|creator")!
			.textContent!
			.trim();

		const coverId = packageDoc
			.querySelector(`package > metadata > meta[name="cover"]`)!
			.getAttribute("content")!;
		const coverEl = packageDoc.getElementById(coverId)!;
		const coverPath = await path.join(packageDir, coverEl.getAttribute("href")!);
		const mimeType = coverEl.getAttribute("media-type")!;

		const coverImage = await fs.readBinaryFile(coverPath);
		const coverUrl = URL.createObjectURL(new Blob([coverImage.buffer], {
			type: mimeType,
		}));

		return {
			id,
			title,
			author,
			coverUrl,
			packageDir,
			packageDoc,
			rootDir: bookPath,
			manifest: packageDoc.querySelector("package > manifest")!,
			spine: packageDoc.querySelector("package > spine")!,
		};
	}
}
