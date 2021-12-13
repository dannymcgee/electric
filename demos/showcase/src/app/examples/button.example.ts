import { Component } from "@angular/core";

import { ButtonComponent } from "@electric/components/button";
import { ICONS } from "@electric/style";
import { keys } from "@electric/utils";

import {
	Defaults,
	html,
	template,
} from "../code-example/code-example.component";

@Component({
	selector: "showcase-button-example",
	template: `
		<showcase-code-example class="example"
			[Component]="ButtonComponent"
			[inputs]="inputs"
			[defaults]="defaults"
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
				<elx-label>Variant</elx-label>
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
				<elx-label>Size</elx-label>
				<elx-radio-group name="size"
					[(ngModel)]="inputs.size"
				>
					<elx-radio value="sm">Small</elx-radio>
					<elx-radio value="md">Medium</elx-radio>
				</elx-radio-group>
			</elx-form-field>

			<elx-form-field>
				<elx-label>Icon</elx-label>
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

	readonly defaults: Defaults = {
		"elx-btn": {
			value: "tertiary",
			keepAttr: true,
		},
		icon: "undefined",
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
		let { variant, icon, size } = this.inputs;
		return template`
			<button elx-btn="${variant}"
				icon="${icon}"
				size="${size}"
			>
				${this.label}
			</button>
		`;
	}
}
