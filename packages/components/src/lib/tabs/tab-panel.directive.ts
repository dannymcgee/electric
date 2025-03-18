import { Directive, Input } from "@angular/core";
import { Coerce, injectTemplate } from "@electric/ng-utils";

@Directive({
	selector: "[elxTabPanel]",
	standalone: false,
})
export class TabPanelDirective {
	@Coerce(Boolean)
	@Input() persistent = false;

	_template = injectTemplate<void>();
}
