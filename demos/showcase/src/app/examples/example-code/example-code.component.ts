import {
	Component,
	HostBinding,
	Input,
	ViewChild,
} from "@angular/core";

import {
	ResizeHandle,
	RESIZE_HANDLE,
} from "@electric/components/resize-handle";

import { Defaults } from "../examples.types";

@Component({
	selector: "showcase-example-code",
	template: `

<elx-resize-handle class="resize-handle"
	direction="vertical"
	align="top"
></elx-resize-handle>

<elx-tab-list #tabs class="tabs">
	<elx-tab #controllerTab
		[disabled]="!controller"
		[active]="!!controller"
	>
		Controller
	</elx-tab>
	<elx-tab #templateTab
		[active]="!controller && !!template"
	>
		Template
	</elx-tab>
	<elx-tab #stylesheetTab
		[disabled]="!stylesheet"
	>
		Stylesheet
	</elx-tab>
</elx-tab-list>

<elx-tab-group class="scroll-container"
	[for]="tabs"
>
	<showcase-example-code-view
		*elxTabPanelFor="controllerTab"
		language="typescript"
		[src]="controller"
	></showcase-example-code-view>

	<showcase-example-code-view
		*elxTabPanelFor="templateTab"
		language="html"
		[src]="template"
		[defaults]="templateDefaults"
	></showcase-example-code-view>

	<showcase-example-code-view
		*elxTabPanelFor="stylesheetTab"
		language="scss"
		[src]="stylesheet"
	></showcase-example-code-view>
</elx-tab-group>

	`,
	styleUrls: ["./example-code.component.scss"],
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
}
