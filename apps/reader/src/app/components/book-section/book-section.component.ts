import {
	Component,
	ViewEncapsulation,
	ChangeDetectionStrategy,
	HostBinding,
	AfterViewInit,
	ElementRef,
	OnDestroy,
	Input,
} from "@angular/core";
import { assertType, isNotNull } from "@electric/utils";
import { path, tauri } from "@tauri-apps/api";

import { Book } from "../../library.service";
import { BookReaderComponent } from "../book-reader/book-reader.component";
import { Highlighter } from "./highlight.service";

@Component({
	selector: "r-book-section",
	template: `<ng-content></ng-content>`,
	styleUrls: ["./book-section.component.scss"],
	encapsulation: ViewEncapsulation.None,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookSectionComponent implements AfterViewInit, OnDestroy {
	@HostBinding("class")
	readonly hostClass = "r-book-section";

	@HostBinding("attr.id")
	@Input() id?: string;

	get element() { return this._elementRef.nativeElement; }
	private _observers: IntersectionObserver[] = [];

	constructor (
		private _elementRef: ElementRef<HTMLElement>,
		private _highlighter: Highlighter,
		private _reader: BookReaderComponent,
	) {}

	async ngAfterViewInit() {
		const codeBlocks = Array.from(
			this.element.querySelectorAll<HTMLPreElement>(".r-code-sample__code")
		);
		for (const codeBlock of codeBlocks) {
			const lang = codeBlock.getAttribute("data-lang");
			if (!lang) continue;

			const root = this._reader.scrollContainer!.nativeElement;
			const observer = new IntersectionObserver(this.observerCallback(codeBlock, lang), {
				root,
				rootMargin: "128px",
				threshold: 0,
			});
			observer.observe(codeBlock);

			this._observers.push(observer);
		}
	}

	ngOnDestroy(): void {
		while (this._observers.length)
			this._observers.pop()!.disconnect();
	}

	observerCallback(codeBlock: HTMLPreElement, language: string) {
		return (entries: IntersectionObserverEntry[], observer: IntersectionObserver) => {
			if (!entries.some(entry => entry.isIntersecting))
				return;

			this._highlighter.highlightElement(codeBlock, language);

			const idx = this._observers.indexOf(observer);
			if (idx !== -1) {
				this._observers.splice(idx, 1);
				observer.disconnect();
			}
		}
	}
}

export class BookSection {
	private _parsedContent?: Promise<Node[][]>;
	get content(): Promise<Node[][]> {
		return this._parsedContent ??= this.parseMarkup();
	}

	constructor (
		public id: string,
		private _doc: Document,
		private _book: Book,
	) {}

	private async parseMarkup(): Promise<Node[][]> {
		const nodes = Array.from(this._doc.body.childNodes);
		const transformed = await Promise.all(nodes.map(node => this.getTransformed(node)));

		return [transformed.filter(isNotNull)];
	}

	private async getTransformed(node: Node): Promise<Node | null> {
		if (node.nodeName === "script")
			return null;

		await this.transform(node);

		return node;
	}

	private async transformInPlace(node: Node, parent: Node): Promise<void> {
		if (node.nodeName === "script") {
			parent.removeChild(node);
			return;
		}

		await this.transform(node);
	}

	private async transform(node: Node): Promise<void> {
		if (node.nodeType === Node.ELEMENT_NODE) {
			assertType<Element>(node);

			if (node.hasAttribute("style"))
				node.removeAttribute("style");

			if (node.nodeName === "pre") {
				this.transformPreNode(node as HTMLPreElement);
				return;
			}

			await this.updateLinks(node);

			node.childNodes.forEach(child => {
				this.transformInPlace(child, node);
			});
		}
	}

	private transformPreNode(node: HTMLPreElement): void {
		node.className = "r-code-sample";

		const code = node.textContent ?? "";
		let lang = node
			.querySelector("code")
			?.getAttribute("data-lang")
			?? "bash";

		if (lang === "c++") lang = "cpp";

		const lineCount = code.split("\n").length;
		const innerHtml
			= `<ol class="r-code-sample__line-numbers">`
				+ `<li />`.repeat(lineCount)
			+ `</ol>`
			+ `<code class="r-code-sample__code" data-lang="${lang}">`
				+ this.escape(code)
			+ `</code>`;

		try {
			node.innerHTML = innerHtml;
		} catch (err) {
			console.error(err, innerHtml);
		}
	}

	private escape(content: string): string {
		return content
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;")
			.replace(/'/g, "&apos;");
	}

	async updateLinks(node: Element): Promise<void> {
		for (let i = 0; i < node.attributes.length; ++i) {
			const attr = node.attributes.item(i)!;

			if (/(href|src)$/.test(attr.name)) {
				const filePath = await path.join(this._book.packageDir, node.getAttribute(attr.name)!);
				const fileUrl = tauri.convertFileSrc(filePath)

				node.setAttribute(attr.name, fileUrl);
			}
		}
	}
}
