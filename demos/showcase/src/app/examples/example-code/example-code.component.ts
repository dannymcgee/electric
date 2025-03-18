import {
	Component,
	HostBinding,
	Input,
	OnInit,
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

<elx-tab-list #tabs class="tabs"
	animated
	[(activeIndex)]="activeTabIndex"
>
	<elx-tab [disabled]="!controller">
		Controller
	</elx-tab>
	<elx-tab>
		Template
	</elx-tab>
	<elx-tab [disabled]="!stylesheet">
		Stylesheet
	</elx-tab>
</elx-tab-list>

<elx-tab-group class="scroll-container"
	animated
	persistent
	[for]="tabs"
>
	<showcase-example-code-view
		*elxTabPanel
		language="typescript"
		[src]="controller"
	></showcase-example-code-view>

	<showcase-example-code-view
		*elxTabPanel
		language="html"
		[src]="template"
		[defaults]="templateDefaults"
	></showcase-example-code-view>

	<showcase-example-code-view
		*elxTabPanel
		language="scss"
		[src]="stylesheet"
	></showcase-example-code-view>
</elx-tab-group>

	`,
	styleUrls: ["./example-code.component.scss"],
	standalone: false,
})
export class ExampleCodeComponent implements OnInit {
	@HostBinding("style.grid-area")
	readonly gridArea = "example-code";

	@HostBinding("class")
	readonly hostClass = "showcase-example-code";

	@Input() controller?: string; // TODO
	@Input() template?: string;
	@Input() templateDefaults?: Defaults;
	@Input() stylesheet?: string; // TODO

	activeTabIndex = -1;

	@ViewChild(RESIZE_HANDLE, { static: true })
	resizeHandle!: ResizeHandle;

	ngOnInit(): void {
		if (this.controller)
			this.activeTabIndex = 0;

		else if (this.template)
			this.activeTabIndex = 1;

		else if (this.stylesheet)
			this.activeTabIndex = 2;
	}
}
