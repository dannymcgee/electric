import {
	Component,
	ContentChildren,
	Directive,
	forwardRef,
	HostBinding,
	Input,
	TemplateRef,
	ViewChild,
} from "@angular/core";

import {
	ResizeHandle,
	RESIZE_HANDLE,
} from "@electric/components/resize-handle";
import { QueryList } from "@electric/ng-utils";

@Component({
	selector: "showcase-example-controls",
	template: `

<elx-resize-handle class="resize-handle"
	direction="horizontal"
	align="left"
/>

<div class="scroll-container">
	@if (_sections) {
		<elx-accordion-group multi>
			@for (section of _sections; track section) {
				<elx-accordion expanded>
					<elx-accordion-header>
						{{ section.name }}
					</elx-accordion-header>
					<section class="controls-section">
						<ng-template
							[ngTemplateOutlet]="section.template"
						/>
					</section>
				</elx-accordion>
			}
			<ng-content />
		</elx-accordion-group>
	}
</div>

	`,
	styleUrls: ["./example-controls.component.scss"],
	standalone: false,
})
export class ExampleControlsComponent {
	@HostBinding("class")
	readonly hostClass = "showcase-example__controls";

	@HostBinding("style.grid-area")
	readonly gridArea = "example-controls";

	@ViewChild(RESIZE_HANDLE, { static: true })
	resizeHandle!: ResizeHandle;

	@ContentChildren(forwardRef(() => ExampleControlsSectionDirective))
	_sections?: QueryList<ExampleControlsSectionDirective>;
}

@Directive({
	selector: "[showcaseControlsSection]",
	standalone: false,
})
export class ExampleControlsSectionDirective {
	@Input("showcaseControlsSection")
	name!: string;

	constructor (
		public template: TemplateRef<void>,
	) {}
}
