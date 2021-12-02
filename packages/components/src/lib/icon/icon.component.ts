import {
	Component,
	ViewEncapsulation,
	ChangeDetectionStrategy,
	Input,
	ElementRef,
	Inject,
	isDevMode,
	HostBinding,
} from "@angular/core";

import { IconSize, SvgIconsConfig } from "@electric/style";
import { camelToKebabCase } from "@electric/utils";

import { IconRegistry } from "./icon.service";
import { SVG_ICONS_CONFIG } from "./icon.types";

@Component({
	selector: "elx-icon",
	template: "",
	styleUrls: ["./icon.component.scss"],
	encapsulation: ViewEncapsulation.None,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IconComponent {
	@Input()
	get icon() { return this._icon; }
	set icon(value) {
		this._icon = value;
		if (value) this.render();
	}
	private _icon?: string;

	@Input() size: IconSize = "md";

	@HostBinding("class")
	get hostClasses() {
		let base = "elx-icon";
		let iconClass = this.icon
			? `${base}--${camelToKebabCase(this.icon)}`
			: "";
		return [base, iconClass];
	}

	@HostBinding("attr.aria-hidden")
	readonly ariaHidden = "true";

	@HostBinding("style.fontSize")
	get fontSize() {
		return this._config.sizes[this.size] ?? null;
	}

	private get _element() {
		return this._elementRef.nativeElement;
	}

	constructor (
		private _elementRef: ElementRef<HTMLElement>,
		private _registry: IconRegistry,
		@Inject(SVG_ICONS_CONFIG) private _config: SvgIconsConfig,
	) {}

	private render(): void {
		if (this.icon && this._registry.has(this.icon)) {
			this._element.innerHTML = this._registry.get(this.icon)!;
		} else if (isDevMode()) {
			console.warn(`No definition found for icon '${this.icon}'!`);
		}
	}
}
