import { Directive, Input, OnChanges, TemplateRef } from "@angular/core";
import { elementId } from "@electric/utils";

import { Tab } from "./tabs.types";

@Directive({
	selector: "[elxTabPanelFor]",
})
export class TabPanelDirective implements OnChanges {
	@Input("elxTabPanelFor")
	tab?: Tab;

	@Input() id = elementId("tab-panel");

	constructor (
		public _template: TemplateRef<void>,
	) {}

	ngOnChanges(): void {
		if (!this.tab) return;

		this.tab.controls = this.id;
	}
}
