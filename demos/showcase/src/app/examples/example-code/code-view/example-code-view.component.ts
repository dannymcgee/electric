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

<ng-container
	*elxUnwrap="(
		src | lines
			| slice : 1
			| stripIndents
			| stripDefaults : defaults
			| fmt : language
		) as lines"
>
	<ol [showcaseLineNumbersFor]="lines"></ol>
	<code class="language-{{ language }}"
		[innerHtml]="
			lines
				| joinLines
				| highlight : language
				| async"
	></code>
</ng-container>

	`,
	styleUrls: ["./example-code-view.component.scss"],
	encapsulation: ViewEncapsulation.None,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExampleCodeViewComponent {
	@HostBinding("class")
	readonly hostClass = "showcase-example-code-view";

	@Input() src?: string;
	@Input() language!: string;
	@Input() defaults?: Defaults;
}
