import { ChangeDetectionStrategy, Component, HostBinding } from "@angular/core";

import { Font } from "../font";
import { FamilyService } from "./family.service";

@Component({
	selector: "g-family-panel",
	templateUrl: "./family-panel.component.html",
	styleUrls: ["./family-panel.component.scss"],
	changeDetection: ChangeDetectionStrategy.OnPush,
	standalone: false,
})
export class FamilyPanelComponent {
	@HostBinding("class.collapsed")
	collapsed = false;

	get family$() { return this._familyService.family$; }
	get fonts$() { return this._familyService.fonts$; }
	get font$() { return this._familyService.font$; }

	constructor (
		private _familyService: FamilyService,
	) {}

	setActive(font: Font) {
		this._familyService.setActive(font);
	}
}
