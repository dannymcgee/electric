import { Component } from "@angular/core";

@Component({
	selector: "showcase-example",
	template: `

<ng-content select="showcase-example-demo"></ng-content>
<ng-content select="showcase-example-controls"></ng-content>
<ng-content select="showcase-example-code"></ng-content>

	`,
	styles: [`

:host {
	display: grid;
	grid-template-areas:
		"example-demo example-controls"
		"example-code example-controls";
	grid-template-columns: 1fr 256px;
	grid-template-rows: 1fr max-content;
	width: 100%;
	height: 100%;
}

	`],
})
export class ExampleComponent {}
