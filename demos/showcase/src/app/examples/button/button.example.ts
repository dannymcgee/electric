import { Component } from "@angular/core";

import { ButtonSize, ButtonVariant } from "@electric/components/button";
import { ICONS } from "@electric/style";
import { keys } from "@electric/utils";

import {	template } from "../../example/example.utilities";
import { Defaults } from "../../example/example.types";

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
	selector: "showcase-button-example",
	templateUrl: "./button.example.html",
	styleUrls: ["./button.example.scss"],
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

		return template`
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
