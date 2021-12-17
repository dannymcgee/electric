import { Component } from "@angular/core";

import { ButtonSize, ButtonVariant } from "@electric/components/button";
import { ICONS } from "@electric/style";
import { keys } from "@electric/utils";

import { Defaults } from "../../examples.types";

class StateModel {
	private _disabled = false;
	get disabled() { return this._disabled; }
	set disabled(value) {
		this._disabled = value;
		if (value) {
			this.hovered = false;
			this.focused = false;
			this.pressed = false;
		}
	}

	hovered = false;
	focused = false;
	pressed = false;
}

@Component({
	templateUrl: "./button.example.html",
	styleUrls: [
		"../example.shared.scss",
		"./button.example.scss",
	],
})
export class ButtonExample {
	icons = keys(ICONS);
	label = "Hello, world!";
	state = new StateModel();

	inputs = {
		variant: "tertiary" as ButtonVariant,
		icon: undefined,
		size: "md" as ButtonSize,
	};

	readonly defaults: Defaults = {
		"elx-btn": {
			value: "tertiary",
			keepAttr: true,
		},
		icon: "undefined",
		size: "md",
	};

	get template() {
		let { variant, icon, size } = this.inputs;
		let { disabled } = this.state;

		return `
			<button elx-btn="${variant}"
				icon="${icon}"
				size="${size}"
				${disabled ? "disabled" : ""}
			>
				${this.label}
			</button>
		`;
	}
}
