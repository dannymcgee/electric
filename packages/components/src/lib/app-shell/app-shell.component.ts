import {
	Component,
	ViewEncapsulation,
	ChangeDetectionStrategy,
	HostBinding,
	Input,
} from "@angular/core";
import { Coerce } from "@electric/ng-utils";

@Component({
	selector: "elx-app-shell",
	templateUrl: "./app-shell.component.html",
	styleUrls: ["./app-shell.component.scss"],
	encapsulation: ViewEncapsulation.None,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppShellComponent {
	@HostBinding("class")
	readonly hostClass = "elx-app-shell";

	@HostBinding("class.elx-app-shell--maximized")
	@Input() maximized = false;

	@HostBinding("class.elx-app-shell--fake-windows-chrome")
	@Coerce(Boolean)
	@Input() fakeWindowsChrome = false;
}
