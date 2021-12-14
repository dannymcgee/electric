import {
	Component,
	HostBinding,
	Input,
	ViewChild,
	ViewEncapsulation,
} from "@angular/core";
import hljs from "highlight.js/lib/core";

import {
	ResizeHandle,
	RESIZE_HANDLE,
} from "@electric/components/resize-handle";

import { Defaults } from "../example.types";
import htmlLang from "./html.language";

@Component({
	selector: "showcase-example-code",
	template: `

<elx-resize-handle class="showcase-example-code__resize-handle"
	direction="vertical"
	align="top"
></elx-resize-handle>

<div class="showcase-example-code__scroll-container"
	><code class="language-html"
		*ngIf="template != null"
		[innerHtml]="template | tokenize : templateDefaults"
	></code
></div>

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

	@ViewChild(RESIZE_HANDLE, { static: true })
	resizeHandle!: ResizeHandle;

	constructor () {
		hljs.registerLanguage("html", htmlLang);
	}
}
