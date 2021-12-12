import {
	Component,
	ViewEncapsulation,
	ChangeDetectionStrategy,
	TemplateRef,
	Input,
	HostBinding,
	HostListener,
	Output,
	EventEmitter,
} from "@angular/core";

import { DetectChanges } from "@electric/ng-utils";

@Component({
	selector: "elx-option-list",
	template: `

<ng-container
	*ngIf="template != null"
	[ngTemplateOutlet]="template"
></ng-container>

	`,
	styleUrls: ["./option-list.component.scss"],
	encapsulation: ViewEncapsulation.None,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OptionListComponent {
	@HostBinding("class")
	readonly hostClass = "elx-option-list";

	@HostBinding("attr.id")
	@DetectChanges()
	@Input() id?: string;

	@DetectChanges()
	@Input() template?: TemplateRef<void>;

	@Output() close = new EventEmitter<void>();

	@HostListener("window:click")
	private onClose(): void {
		this.close.emit();
	}
}
