import { Component, HostBinding } from "@angular/core";

@Component({
	selector: "showcase-example-demo",
	template: `<ng-content></ng-content>`,
	styleUrls: ["./example-demo.component.scss"],
})
export class ExampleDemoComponent {
	@HostBinding("style.grid-area")
	readonly gridArea = "example-demo";
}
