import {
	ChangeDetectorRef,
	Component,
	ComponentRef,
	DoCheck,
	Input,
	OnChanges,
	OnInit,
	SimpleChange,
	Type,
	ViewChild,
	ViewContainerRef,
} from "@angular/core";

import { array, entries } from "@electric/utils";

export type Inputs = Record<string, any>;

@Component({
	selector: "showcase-code-example",
	template: `

<div class="component">
	<ng-container #componentOutlet></ng-container>
</div>
<div class="controls">
	<ng-content></ng-content>
</div>
<pre class="code" [innerHtml]="template"></pre>

	`,
	styleUrls: ["./code-example.component.scss"],
})
export class CodeExampleComponent<C> implements OnInit, OnChanges, DoCheck {
	@Input() Component!: Type<C>;
	@Input() inputs!: Partial<C>;
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
