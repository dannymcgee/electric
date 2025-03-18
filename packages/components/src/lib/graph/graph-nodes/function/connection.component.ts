import {
	ChangeDetectionStrategy,
	Component,
	HostBinding,
	inject,
	Input,
	OnInit,
	ViewEncapsulation,
} from "@angular/core";
import chroma, { Color } from "chroma-js";

import { Coerce } from "@electric/ng-utils";

import { GraphLibrary } from "../../graph-library.service";

@Component({
	selector: "elx-function-cx",
	template: ``,
	styleUrls: ["./connection.component.scss"],
	encapsulation: ViewEncapsulation.None,
	changeDetection: ChangeDetectionStrategy.OnPush,
	standalone: false,
})
export class FunctionConnectionComponent implements OnInit {
	@HostBinding("class")
	readonly hostClass = "elx-function-cx";

	@HostBinding("class.connected")
	@Input() @Coerce(Boolean) connected = false;

	@Input() type!: string;

	@HostBinding("style.--color-base")
	@HostBinding("data-color-base")
	get color() { return this._color ??= this._baseColor?.hex(); }
	private _color?: string;

	@HostBinding("style.--color-dim")
	@HostBinding("data-color-dim")
	get dimColor() {
		return this._dimColor ??= this._baseColor
			?.darken(0.333)
			.desaturate(0.5)
			.alpha(0.333)
			.hex();
	}
	private _dimColor?: string;

	@HostBinding("style.--color-glow")
	@HostBinding("data-color-glow")
	get glowColor() {
		return this._glowColor ??= this._baseColor
			?.alpha(0.5)
			.hex();
	}
	private _glowColor?: string;

	private _baseColor?: Color;
	private _library = inject(GraphLibrary);

	ngOnInit(): void {
		this._baseColor = chroma(this._library.typeColor(this.type));
	}
}
