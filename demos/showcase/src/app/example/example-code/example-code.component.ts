import {
	Component,
	HostBinding,
	Input,
	ViewEncapsulation,
} from "@angular/core";
import hljs from "highlight.js/lib/core";

import { Defaults } from "../example.types";
import htmlLang from "./html.language";

@Component({
	selector: "showcase-example-code",
	template: `

<code class="language-html"
	*ngIf="template != null"
	[innerHtml]="template | tokenize : templateDefaults"
></code>

	`,
	styleUrls: ["./example-code.component.scss"],
	encapsulation: ViewEncapsulation.None,
})
export class ExampleCodeComponent {
	@HostBinding("style.grid-area")
	readonly gridArea = "example-code";

	@HostBinding("class")
	readonly hostClass = "showcase-example-code";

	@Input() controller?: string; // TODO
	@Input() template?: string;
	@Input() templateDefaults?: Defaults;
	@Input() stylesheet?: string; // TODO

	constructor () {
		hljs.registerLanguage("html", htmlLang);
	}
}
