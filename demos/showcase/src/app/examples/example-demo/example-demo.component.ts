import { Component, HostBinding } from "@angular/core";

@Component({
	selector: "showcase-example-demo",
	template: `<ng-content />`,
	styleUrls: ["./example-demo.component.scss"],
	standalone: false,
})
export class ExampleDemoComponent {
	@HostBinding("style.grid-area")
	readonly gridArea = "example-demo";
}
