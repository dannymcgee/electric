import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	HostBinding,
	HostListener,
	inject,
	Input,
	Output,
	TemplateRef,
	ViewEncapsulation,
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

	private _cdRef = inject(ChangeDetectorRef);
	get changeDetector() { return this._cdRef; }
}
