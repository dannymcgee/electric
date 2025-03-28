import {
	Component,
	ViewEncapsulation,
	ChangeDetectionStrategy,
	HostBinding,
	TemplateRef,
	ChangeDetectorRef,
	inject,
} from "@angular/core";
import { injectRef } from "@electric/ng-utils";

import { MenuPanel } from "../menu.types";

@Component({
	selector: "elx-menu-panel",
	template: `

@if (template != null) {
	<ng-container *ngTemplateOutlet="template" />
}

`,
	styleUrls: ["./menu-panel.component.scss"],
	encapsulation: ViewEncapsulation.None,
	changeDetection: ChangeDetectionStrategy.OnPush,
	standalone: false,
})
export class MenuPanelComponent implements MenuPanel {
	@HostBinding("class")
	readonly hostClass = "elx-menu-panel";

	@HostBinding("attr.role")
	readonly role = "menu";

	get template() { return this._template; }
	set template(value) {
		this._template = value;
		this._changeDetector.markForCheck();
	}
	private _template?: TemplateRef<void>;

	elementRef = injectRef<HTMLElement>();
	private _changeDetector = inject(ChangeDetectorRef);
}
