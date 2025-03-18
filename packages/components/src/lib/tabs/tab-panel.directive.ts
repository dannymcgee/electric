import { Directive, Input, TemplateRef } from "@angular/core";
import { Coerce } from "@electric/ng-utils";

@Directive({
	selector: "[elxTabPanel]",
	standalone: false,
})
export class TabPanelDirective {
	@Coerce(Boolean)
	@Input() persistent = false;

	constructor (
		public _template: TemplateRef<void>,
	) {}
}
