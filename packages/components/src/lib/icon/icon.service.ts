import { DOCUMENT } from "@angular/common";
import { Inject, Injectable } from "@angular/core";

import { SvgIconsConfig, SvgIcon } from "@electric/style";
import { entries } from "@electric/utils";

import { SVG_ICONS_CONFIG } from "./icon.types";

@Injectable()
export class IconRegistry<T extends SvgIconsConfig> {
	private _svgMap = new Map<keyof T["icons"], SvgIcon>();

	constructor (
		@Inject(DOCUMENT) private _document: Document,
		@Inject(SVG_ICONS_CONFIG) config: T,
	) {
		if (config.icons) {
			this.register(config.icons);
		}
	}

	has(id: keyof T["icons"]) {
		return this._svgMap.has(id);
	}

	get(id: keyof T["icons"]) {
		let svg = this._svgMap.get(id);
		if (!svg) return null;

		svg.validate();

		return svg.content;
	}

	private register(icons: T["icons"]) {
		for (let [id, content] of entries(icons)) {
			this._svgMap.set(id, new SvgIcon(content, this._document));
		}
	}
}
