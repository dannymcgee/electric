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

@if (template != null) {
	<ng-container *ngTemplateOutlet="template" />
}

`,
	styleUrls: ["./option-list.component.scss"],
	encapsulation: ViewEncapsulation.None,
	changeDetection: ChangeDetectionStrategy.OnPush,
	standalone: false,
})
export class OptionListComponent {
	@HostBinding("class")
	readonly hostClass = "elx-option-list";

	@HostBinding("attr.id")
	@DetectChanges()
	@Input() id?: string;

	@DetectChanges()
	@Input() template?: TemplateRef<void>;

	// eslint-disable-next-line @angular-eslint/no-output-native
	@Output() close = new EventEmitter<void>();

	@HostListener("window:click")
	private onClose(): void {
		this.close.emit();
	}

	private _cdRef = inject(ChangeDetectorRef);
	get changeDetector() { return this._cdRef; }
}
