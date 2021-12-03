import {
	ConfigurableFocusTrap,
	ConfigurableFocusTrapFactory,
} from "@angular/cdk/a11y";
import { DragRef, DragDrop } from "@angular/cdk/drag-drop";
import { DOCUMENT } from "@angular/common";
import {
	AfterContentInit,
	ChangeDetectionStrategy,
	Component,
	ContentChild,
	ContentChildren,
	Directive,
	ElementRef,
	EventEmitter,
	forwardRef,
	HostBinding,
	HostListener,
	Inject,
	Input,
	OnDestroy,
	OnInit,
	Output,
	QueryList,
	ViewEncapsulation,
} from "@angular/core";

import { ButtonComponent } from "@electric/components/button";
import { IconName } from "@electric/components/icon";
import { Coerce, GlobalFocusManager } from "@electric/ng-utils";

@Component({
	selector: "elx-dialog",
	templateUrl: "./dialog.component.html",
	styleUrls: ["./dialog.component.scss"],
	encapsulation: ViewEncapsulation.None,
	exportAs: "dialog",
})
export class DialogComponent implements OnInit, AfterContentInit, OnDestroy {
	@HostBinding("class")
	readonly hostClass = "elx-dialog";

	@HostBinding("attr.role")
	@Input() role: "dialog"|"alert" = "dialog";

	@HostBinding("class.loader")
	@Coerce(Boolean)
	@Input() loader = false;

	@Coerce(Boolean)
	@Input() indeterminate = false;

	@Coerce(Number)
	@Input() total?: number;

	@Input()
	get completed() { return this._completed; }
	set completed(value) {
		if (this.total != null && value != null) {
			this._completed = Math.min(value, this.total);
		}
	}
	private _completed?: number;

	@Output("close")
	closeEvent = new EventEmitter<void>();

	@ContentChild(forwardRef(() => DialogHeadingComponent))
	_heading?: DialogHeadingComponent;

	@ContentChild(forwardRef(() => DialogFooterDirective))
	_footer?: DialogFooterDirective;

	private _dragRef?: DragRef;
	private _focusTrap!: ConfigurableFocusTrap;

	constructor (
		private _dragDrop: DragDrop,
		@Inject(DOCUMENT) private _document: Document,
		private _elementRef: ElementRef<HTMLElement>,
		private _focusTrapFactory: ConfigurableFocusTrapFactory,
		private _globalFocusManager: GlobalFocusManager,
	) {}

	ngOnInit(): void {
		this._focusTrap = this._focusTrapFactory.create(
			this._elementRef.nativeElement,
			{ defer: true },
		);
	}

	ngAfterContentInit(): void {
		if (this._heading) {
			this._dragRef = this._dragDrop
				.createDrag(this._elementRef)
				.withBoundaryElement(this._document.body)
				.withHandles([this._heading._elementRef]);
		}

		let primaryButtons = this._footer
			?._buttons
			?.filter(btn => btn.variant === "primary");

		if (primaryButtons?.length) {
			this._focusTrap.attachAnchors();
			setTimeout(() => {
				primaryButtons?.[0]?.focus("keyboard");
			});
		} else {
			this._focusTrap.attachAnchors();
			this._focusTrap.focusFirstTabbableElementWhenReady()
		}
	}

	ngOnDestroy(): void {
		this._focusTrap.destroy();
		this._dragRef?.dispose();

		setTimeout(() => {
			this._globalFocusManager
				.getLastValidFocusTarget()
				?.focus();
		});
	}

	@HostListener("window:keydown.esc")
	close(): void {
		this.closeEvent.emit();
	}
}

@Component({
	selector: "elx-dialog-heading, [elx-dialog-heading]",
	template: `
		<elx-icon class="elx-dialog-heading__icon"
			*ngIf="icon"
			[icon]="icon"
		></elx-icon>

		<h3 class="elx-dialog-heading__title">
			<ng-content></ng-content>
		</h3>
	`,
	encapsulation: ViewEncapsulation.None,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialogHeadingComponent {
	@HostBinding("class")
	readonly hostClass = "elx-dialog-heading";

	@Input() icon?: IconName;

	constructor (
		public _elementRef: ElementRef,
	) {}
}

@Directive({
	selector: "elx-dialog-footer, [elx-dialog-footer]",
})
export class DialogFooterDirective {
	@HostBinding("class")
	readonly hostClass = "elx-dialog-footer";

	// TODO: This reduces interop flexibility and bloats this module's dependencies;
	// Consider using a specific InjectionToken instead
	@ContentChildren(ButtonComponent)
	_buttons?: QueryList<ButtonComponent>;
}
