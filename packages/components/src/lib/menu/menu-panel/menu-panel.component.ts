import {
	Component,
	ViewEncapsulation,
	ChangeDetectionStrategy,
	HostBinding,
	TemplateRef,
	ChangeDetectorRef,
	ElementRef,
} from "@angular/core";

import { MenuPanel } from "../menu.types";

@Component({
	selector: "elx-menu-panel",
	templateUrl: "./menu-panel.component.html",
	styleUrls: ["./menu-panel.component.scss"],
	encapsulation: ViewEncapsulation.None,
	changeDetection: ChangeDetectionStrategy.OnPush,
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

	constructor (
		public elementRef: ElementRef<HTMLElement>,
		private _changeDetector: ChangeDetectorRef,
	) {}
}
