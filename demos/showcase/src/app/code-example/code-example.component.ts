import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ComponentRef,
	DoCheck,
	Input,
	OnChanges,
	OnInit,
	Pipe,
	PipeTransform,
	SimpleChange,
	Type,
	ViewChild,
	ViewContainerRef,
} from "@angular/core";
import hljs from "highlight.js/lib/core";

import { array, entries, isNotNull } from "@electric/utils";

import htmlLang, { IDENT as HTML_IDENT } from "./html.language";
import { regex } from "@vscode-devkit/grammar";

hljs.registerLanguage("html", htmlLang);

export type Inputs = Record<string, any>;

export type Defaults = {
	[key: string]: string | DefaultOptions;
}

interface DefaultOptions {
	value: string;
	keepAttr: boolean;
}

@Component({
	selector: "showcase-code-example",
	template: `

<div class="component">
	<ng-container #componentOutlet></ng-container>
</div>
<div class="controls">
	<ng-content></ng-content>
</div>
<pre class="code"
	><code class="language-html"
		[innerHtml]="template | tokenize : defaults"
	></code
></pre>

	`,
	styleUrls: ["./code-example.component.scss"],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CodeExampleComponent<C> implements OnInit, OnChanges, DoCheck {
	@Input() Component!: Type<C>;
	@Input() inputs!: Partial<C>;
	@Input() defaults?: Defaults;
	@Input() content?: Node[][];
	@Input() template!: string;

	private _prevInputs?: Partial<C>;
	private _componentRef?: ComponentRef<C>;

	@ViewChild("componentOutlet", { read: ViewContainerRef, static: true })
	private _outlet!: ViewContainerRef;

	ngOnInit(): void {
		this._prevInputs = { ...this.inputs };
		this._componentRef = this._outlet.createComponent(this.Component, {
			projectableNodes: this.content,
		});

		let instance = this._componentRef.instance;
		for (let [key, value] of entries(this.inputs)) {
			instance[key] = value!;
		}
	}

	ngOnChanges(changes: Record<keyof this, SimpleChange>): void {
		if (!this._componentRef) return;

		if (changes.content) {
			this._outlet.clear();
			this._componentRef = this._outlet.createComponent(this.Component, {
				projectableNodes: this.content,
			});

			let instance = this._componentRef.instance;
			for (let [key, value] of entries(this.inputs)) {
				instance[key] = value!;
			}
		}
	}

	ngDoCheck(): void {
		let needsCheck = false;
		let instance = this._componentRef!.instance;

		for (let [key, value] of entries(this.inputs)) {
			if (this._prevInputs![key] !== value) {
				needsCheck = true;
				instance[key] = value!;
				this._prevInputs![key] = value!;
			}
		}

		if (needsCheck) {
			this._componentRef!
				.injector
				.get(ChangeDetectorRef)
				.markForCheck();
		}
	}
}

@Pipe({
	name: "tokenize",
	pure: true,
})
export class TokenizePipe implements PipeTransform {
	transform(markup: string, defaults?: Defaults): string {
		markup = this
			.stripLeadingIndents(markup)
			.map(line => this.stripDefaults(line, defaults))
			.filter(isNotNull)
			.join("\n");

		markup = this.format(markup);
		markup = hljs.highlight(markup, { language: "html" }).value;

		return markup
			.split("\n")
			.map((line, idx) =>
				`<span class="hljs-line-num">${
					idx + 1
				}</span>${
					line.replace("\t", "   ")
				}`
			)
			.join("\n");
	}

	private stripLeadingIndents(markup: string): string[] {
		let leadingIndent = "";
		return markup
			.split("\n")
			.filter(line => !/^\s*$/.test(line))
			.map((line, idx) => {
				if (idx === 0) {
					leadingIndent = line.match(/^\t+/)?.[0] ?? "";
				}
				return line.replace(leadingIndent, "");
			});
	}

	private stripDefaults(line: string, defaults?: Defaults): string | null {
		if (!defaults) return line;

		let match = line.match(regex`/(${HTML_IDENT})="([^"]*)"/`);
		if (!match) return line;

		let [_, matchKey, matchValue] = match;
		for (let [key, options] of entries(defaults)) {
			if (matchKey !== key)
				continue;

			let value = typeof options === "object"
				? options.value
				: options;

			if (matchValue === value) {
				if (typeof options === "object" && options.keepAttr) {
					return line.replace(/="([^"]*)"/, "");
				}
				return null;
			}
		}

		return line;
	}

	private format(markup: string): string {
		return markup.replace(/(<)([^\n]+)\n(s*>)/g, "$1$2$3");
	}
}

export function html(strings: TemplateStringsArray, ...values: any[]) {
	let markup = interpolate(strings, ...values);
	let doc = new DOMParser().parseFromString(markup, "text/html");

	return [array(doc.body.childNodes)];
}

export function template(strings: TemplateStringsArray, ...values: any[]) {
	return interpolate(strings, ...values);
}

function interpolate(strings: TemplateStringsArray, ...values: any[]) {
	return strings.raw.reduce((accum, current, idx) => {
		accum += current;
		if (idx < values.length) {
			accum += values[idx]?.toString();
		}
		return accum;
	}, "");
}
