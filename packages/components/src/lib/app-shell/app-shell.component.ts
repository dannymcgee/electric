import {
	Component,
	ViewEncapsulation,
	ChangeDetectionStrategy,
	HostBinding,
	Input,
} from "@angular/core";

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
}
