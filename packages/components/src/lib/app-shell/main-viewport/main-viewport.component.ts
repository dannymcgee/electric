import {
	Component,
	ViewEncapsulation,
	ChangeDetectionStrategy,
	HostBinding,
	Input,
} from "@angular/core";

import { Coerce } from "@electric/ng-utils";

@Component({
	selector: "elx-main-viewport, [elx-main-viewport]",
	template: `<ng-content />`,
	styleUrls: ["./main-viewport.component.scss"],
	encapsulation: ViewEncapsulation.None,
	changeDetection: ChangeDetectionStrategy.OnPush,
	standalone: false,
})
export class MainViewportComponent {
	@HostBinding("class")
	readonly hostClass = "elx-main-viewport";

	@HostBinding("attr.role")
	readonly role = "main";

	@HostBinding("class.elx-main-viewport--scroll")
	@Coerce(Boolean)
	@Input() scroll?: boolean | "";
}
