import { Injectable, OnDestroy } from "@angular/core";
import { assertType, isNotNull } from "@electric/utils";
import { fs, path } from "@tauri-apps/api";
import { BehaviorSubject } from "rxjs";

import { Book } from "../../library.service";
import { BookSection } from "../book-section/book-section.component";

export interface NavPoint {
	label: string;
	href: string;
	children: NavPoint[];
}

@Injectable()
export class BookReaderService implements OnDestroy {
	private _navPoints$ = new BehaviorSubject<NavPoint[] | null>(null);
	get navPoints$() { return this._navPoints$.asObservable(); }

	private _sections$ = new BehaviorSubject<BookSection[] | null>(null);
	get sections$() { return this._sections$.asObservable(); }

	private _parser = new DOMParser();

	ngOnDestroy(): void {
		this._navPoints$.complete();
		this._sections$.complete();
	}

	async load(book: Book) {
		const tocId = book.spine.getAttribute("toc")!;
		const tocEl = book.packageDoc.getElementById(tocId)!;
		const tocPath = await path.join(book.packageDir, tocEl.getAttribute("href")!);
		const tocContents = await fs.readTextFile(tocPath);
		const tocDoc = this._parser.parseFromString(tocContents, "text/xml");

		const navPoints = await Promise.all(
			Array.from(tocDoc.querySelectorAll("navMap > navPoint"))
				.map(el => this.parseNavPoint(el, book.packageDir))
		);
		this._navPoints$.next(navPoints);

		const sections = (await Promise.all(
			Array.from(book.spine.children)
				.map(el => this.buildSection(el, book))
		)).filter(isNotNull);
		this._sections$.next(sections);
	}

	private async parseNavPoint(el: Element, packageDir: string): Promise<NavPoint> {
		const label = el.querySelector("navLabel > text")!.textContent!.trim();
		const href = "#" + await path.basename(
			el.querySelector("content")!
				.getAttribute("src")!
				.replace(/\.[^.]+$/, "")
		);

		const children = await Promise.all(
			Array.from(el.children)
				.filter(child => child.tagName === "navPoint")
				.map(child => this.parseNavPoint(child, packageDir))
		);

		return {
			label,
			href,
			children,
		};
	}

	private async buildSection(itemRef: Element, book: Book): Promise<BookSection | null> {
		const elId = itemRef.getAttribute("idref")!;
		const el = book.packageDoc.getElementById(elId)!;
		const mimeType = el.getAttribute("media-type")!;

		const supportedTypes = [
			"application/xhtml+xml",
			"application/xml",
			"image/svg+xml",
			"text/html",
			"text/xml",
		];

		if (!supportedTypes.includes(mimeType))
			return null;

		assertType<DOMParserSupportedType>(mimeType);

		const href = el.getAttribute("href")!;
		const id = href.replace(/\.[^.]+$/, "");

		const filePath = await path.join(book.packageDir, href);
		const fileContent = await fs.readTextFile(filePath);
		const fileDoc = this._parser.parseFromString(fileContent, mimeType);

		return new BookSection(id, fileDoc, book);
	}
}
