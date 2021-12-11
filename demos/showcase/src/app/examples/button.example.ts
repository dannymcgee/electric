import { Component } from "@angular/core";

import { ButtonComponent } from "@electric/components/button";
import { ICONS } from "@electric/style";
import { keys } from "@electric/utils";

import { html } from "../code-example/code-example.component";

@Component({
	selector: "showcase-button-example",
	template: `
		<showcase-code-example class="example"
			[Component]="ButtonComponent"
			[inputs]="inputs"
			[content]="content"
			[template]="template"
		>
			<elx-form-field>
				<elx-label>Label</elx-label>
				<input elx-input
					[(ngModel)]="label"
				/>
			</elx-form-field>

			<elx-form-field>
				<elx-legend>Variant</elx-legend>
				<elx-radio-group name="variant"
					[(ngModel)]="inputs.variant"
				>
					<elx-radio value="primary">Primary</elx-radio>
					<elx-radio value="secondary">Secondary</elx-radio>
					<elx-radio value="tertiary">Tertiary</elx-radio>
					<elx-radio value="warning">Warning</elx-radio>
				</elx-radio-group>
			</elx-form-field>

			<elx-form-field>
				<elx-legend>Size</elx-legend>
				<elx-radio-group name="size"
					[(ngModel)]="inputs.size"
				>
					<elx-radio value="sm">Small</elx-radio>
					<elx-radio value="md">Medium</elx-radio>
				</elx-radio-group>
			</elx-form-field>

			<elx-form-field>
				<elx-legend>Icon</elx-legend>
				<elx-select [(ngModel)]="inputs.icon">
					<elx-option>None</elx-option>
					<elx-option *ngFor="let icon of icons"
						[value]="icon"
					>
						<elx-icon class="icon"
							size="sm"
							[icon]="icon"
						></elx-icon>
						{{ icon }}
					</elx-option>
				</elx-select>
			</elx-form-field>
		</showcase-code-example>
	`,
	styles: [`
		:host {
			display: block;
		}
		:host, .example {
			width: 100%;
			height: 100%;
		}
		.icon {
			margin-right: 8px;
			opacity: 0.667;
		}
	`],
})
export class ButtonExample {
	ButtonComponent = ButtonComponent;
	icons = keys(ICONS);
	label = "Hello, world!";

	inputs: Partial<ButtonComponent> = {
		variant: "tertiary",
		icon: undefined,
		size: "md",
	};

	testSelect?: string;

	private _cachedLabel?: string;
	private _cachedContent?: Node[][];
	get content() {
		if (this.label !== this._cachedLabel) {
			this._cachedLabel = this.label;
			this._cachedContent = html`${this.label}`;
		}
		return this._cachedContent;
	}

	get template() {
		let content = `<span class="op">&lt;</span>`
			+ `<span class="tag">button</span> `
			+ `<span class="attr">elx-btn</span>`;

		if (this.inputs.variant && this.inputs.variant !== "tertiary")
			content += `&equals;`
				+ `<span class="attr-value">&quot;${
					this.inputs.variant
				}&quot;</span>`;

		if (this.inputs.icon)
			content += `\n  `
				+ `<span class="attr">icon</span>`
				+ `&equals;`
				+ `<span class="attr-value">&quot;${this.inputs.icon}&quot;</span>`;

		if (this.inputs.size && this.inputs.size !== "md")
			content += `\n  `
				+ `<span class="attr">size</span>`
				+ `&equals;`
				+ `<span class="attr-value">&quot;${this.inputs.size}&quot;</span>`;

		if (content.includes("\n"))
			content += "\n";

		content += `<span class="op">&gt;</span>`
			+ `\n  ${this.label}\n`
			+ `<span class="op">&lt;/</span>`
			+ `<span class="tag">button</span>`
			+ `<span class="op">&gt;</span>`;

		return content;
	}
}
