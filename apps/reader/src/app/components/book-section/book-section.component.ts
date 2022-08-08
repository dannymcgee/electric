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
import { assertType, isNotNull, match } from "@electric/utils";
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

		return this.transform(node);
	}

	private async transformInPlace(node: Node, parent: Node): Promise<void> {
		if (node.nodeName === "script") {
			parent.removeChild(node);
			return;
		}

		const result = await this.transform(node);
		if (result !== node) {
			if (result !== null)
				parent.insertBefore(result, node);

			parent.removeChild(node);
		}
	}

	private async transform(node: Node): Promise<Node | null> {
		if (node.nodeType === Node.ELEMENT_NODE) {
			assertType<Element>(node);

			if (node.hasAttribute("style"))
				node.removeAttribute("style");

			if (node.nodeName === "pre") {
				return this.transformPreNode(node as HTMLPreElement);
			}

			if (node.nodeName === "table") {
				assertType<HTMLTableElement>(node);

				if (node.classList.contains("processedcode")) {
					return this.transformCodeBlockTable(node);
				}
			}

			await this.updateLinks(node);

			node.childNodes.forEach(child => {
				this.transformInPlace(child, node);
			});
		}

		return node;
	}

	private transformPreNode(node: HTMLPreElement): HTMLPreElement {
		node.className = "r-code-sample";

		const redundantLineNos = Array.from(node.querySelectorAll(".lineno"));
		for (let el of redundantLineNos) {
			node.removeChild(el);
		}

		const code = node.textContent?.trim() ?? "";
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

		return node;
	}

	// Why, ANTLR book? Why??
	private transformCodeBlockTable(node: HTMLTableElement): HTMLElement {
		const figure = document.createElement("figure");

		let heading: string | undefined;
		let gutterLines: string[] = [];
		const codeLines: string[] = [];

		const clean = (s?: string | null): string => {
			if (!s) return "";
			return s.replace(/(&ZeroWidthSpace;|\u200b)/g, "");
		}

		Array.from(node.querySelectorAll("tr"))
			.forEach((tr, idx) => {
				if (idx === 0 && tr.querySelector("td")?.getAttribute("colspan") === "2") {
					heading = clean(tr.textContent);
					return;
				}

				const tds = Array.from(tr.querySelectorAll("td"));
				match(tds.length, {
					0: () => {},
					1: () => {
						codeLines.push(clean(tds[0].textContent));
					},
					2: () => {
						const [gutterTd, codeTd] = tds;
						gutterLines.push(clean(gutterTd.textContent).trim());
						codeLines.push(clean(codeTd.textContent));
					},
				});
			});

		if (!gutterLines.some(Boolean))
			gutterLines = [];

		let lang = "java";
		if (codeLines.some(line => line.trim().startsWith("$")))
			lang = "bash";
		else if (codeLines.some(line => /^\s*([|;]|[a-zA-Z]+ ?:)/.test(line)))
			lang = "antlr4";

		let figureMarkup: string[] = [];

		if (heading)
			figureMarkup.push(`<figcaption>${heading.trim()}</figcaption>`);

		let inputLinesLength = 0;

		figureMarkup.push(`<pre class="r-code-sample">`);
		if (gutterLines.length) {
			inputLinesLength = gutterLines.filter(line => line === "=>").length;

			figureMarkup.push(
				`<div class="r-code-sample__gutter">`,
				...gutterLines.map(line => {
					if (line === "=>")
						return `<div class="input">&gt;</div>`;
					if (line === "<=")
						return `<div class="output">&lt;&lt;</div>`;

					return `<div>${line}</div>`;
				}),
				`</div>`,
			);
		} else {
			figureMarkup.push(
				`<ol class="r-code-sample__line-numbers">`,
				...`<li />`.repeat(codeLines.length),
				`</ol>`,
			);
		}

		const inputLines = codeLines.slice(0, inputLinesLength);
		if (inputLines.length) {
			figureMarkup.push(
				`<code
					class="r-code-sample__code r-code-sample__code--dim"
					data-lang="${lang}"
				>${
					inputLines.join("\n")
				}</code>\n`,
			);
		}

		figureMarkup.push(
			`<code class="r-code-sample__code" data-lang="${lang}">${
				codeLines.slice(inputLinesLength).join("\n")
			}</code>`,
		);

		figureMarkup.push(`</pre>`);

		figure.innerHTML = figureMarkup.join("");

		return figure;
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
