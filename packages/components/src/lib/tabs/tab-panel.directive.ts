import { Directive, Input, OnChanges, TemplateRef } from "@angular/core";
import { elementId } from "@electric/utils";

import { Tab } from "./tabs.types";

@Directive({
	selector: "[elxTabPanelFor]",
})
export class TabPanelDirective implements OnChanges {
	@Input("elxTabPanelFor")
	_tab?: Tab;

	@Input() id = elementId("tab-panel");

	constructor (
		public _template: TemplateRef<void>,
	) {}

	ngOnChanges(): void {
		if (!this._tab) return;

		this._tab.controls = this.id;
	}
}
