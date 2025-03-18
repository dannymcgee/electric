import { Highlightable, ListKeyManagerOption } from "@angular/cdk/a11y";
import { DOCUMENT } from "@angular/common";
import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	EventEmitter,
	HostBinding,
	HostListener,
	Inject,
	inject,
	Input,
	Output,
	TemplateRef,
	ViewChild,
	ViewEncapsulation,
} from "@angular/core";

import { DetectChanges } from "@electric/ng-utils";
import { a11y } from "@electric/style";
import { elementId, getLabel } from "@electric/utils";

import { Option, OPTION } from "../select.types";

@Component({
	selector: "elx-option",
	template: `

<ng-template
	[ngTemplateOutlet]="contentTemplate"
></ng-template>

<ng-template #contentTemplate>
	<ng-content></ng-content>
</ng-template>

	`,
	styleUrls: ["./option.component.scss"],
	providers: [{
		provide: OPTION,
		useExisting: OptionComponent,
	}],
	encapsulation: ViewEncapsulation.None,
	changeDetection: ChangeDetectionStrategy.OnPush,
	standalone: false,
})
export class OptionComponent<T>
implements
	Option<T>,
	ListKeyManagerOption,
	Highlightable
{
	@HostBinding("class")
	readonly hostClass = "elx-option";

	@HostBinding("attr.role")
	readonly role = "option";

	@HostBinding("attr.id")
	@Input() id = elementId("option");

	@Input() value?: T;

	@HostBinding("attr.aria-disabled")
	@Input() disabled?: boolean;

	@HostBinding("class.active")
	@HostBinding("attr.aria-selected")
	@DetectChanges()
	_active: true|null = null;

	@ViewChild(TemplateRef, { static: true })
	@DetectChanges()
	template!: TemplateRef<void>

	get elementHeight() {
		let remBase = parseInt(
			getComputedStyle(this._document.documentElement)
				.getPropertyValue("font-size")
				.replace("px", ""),
			10,
		);
		// NOTE: Must be kept in sync with the stylesheet property
		return (14 / a11y.REM_BASE_DEFAULT) * remBase + 18;
	}

	// eslint-disable-next-line @angular-eslint/no-output-native
	@Output() select = new EventEmitter<Option<T>>();

	private _cdRef = inject(ChangeDetectorRef);
	get changeDetector() { return this._cdRef; }

	constructor (
		@Inject(DOCUMENT) private _document: Document,
		private _elementRef: ElementRef<HTMLElement>,
	) {}

	@HostListener("click")
	onSelect(): void {
		this.select.emit(this);
	}

	getLabel(): string {
		return getLabel(this._elementRef.nativeElement);
	}

	setActiveStyles(): void {
		this._active = true;
	}

	setInactiveStyles(): void {
		this._active = null;
	}
}
