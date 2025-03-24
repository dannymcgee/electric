import {
	ChangeDetectionStrategy,
	Component,
	HostBinding,
	Input,
	ViewEncapsulation,
} from "@angular/core";

import { Defaults } from "../../examples.types";

@Component({
	selector: "showcase-example-code-view",
	template: `

@let lines = src
	| lines
	| slice : 1
	| stripIndents
	| stripDefaults : defaults
	| fmt : language
	| async;

<ol [showcaseLineNumbersFor]="lines ?? []"></ol>
<code class="language-{{ language }}"
	[innerHtml]="
		lines ?? []
			| joinLines
			| highlight : language
			| async"
></code>

	`,
	styleUrls: ["./example-code-view.component.scss"],
	encapsulation: ViewEncapsulation.None,
	changeDetection: ChangeDetectionStrategy.OnPush,
	standalone: false,
})
export class ExampleCodeViewComponent {
	@HostBinding("class")
	readonly hostClass = "showcase-example-code-view";

	@Input() src?: string;
	@Input() language!: string;
	@Input() defaults?: Defaults;
}
