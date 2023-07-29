import {
	ConfigurableFocusTrap,
	ConfigurableFocusTrapFactory,
} from "@angular/cdk/a11y";
import { coerceBooleanProperty } from "@angular/cdk/coercion";
import { DragRef, DragDrop } from "@angular/cdk/drag-drop";
import { DOCUMENT } from "@angular/common";
import {
	AfterContentInit,
	Attribute,
	ChangeDetectionStrategy,
	Component,
	ContentChild,
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
	ViewEncapsulation,
} from "@angular/core";

import { IconName } from "@electric/components/icon";
import {
	Coerce,
	Focusable,
	GlobalFocusManager,
	INITIAL_FOCUS_TARGET,
} from "@electric/ng-utils";

@Component({
	selector: "elx-dialog",
	template: `

<div class="elx-dialog-main">
	<div *ngIf="loader"
		class="elx-dialog-progress"
		[class.elx-dialog-progress--indeterminate]="indeterminate"
	>
		<div *ngIf="!indeterminate"
			class="elx-dialog-progress__value"
			[style.width]="completed! / total! | percent : '1.0-3'"
		></div>
	</div>
	<ng-content select="elx-dialog-heading, [elx-dialog-heading]"></ng-content>
	<section class="elx-dialog-body">
		<ng-content></ng-content>
	</section>
</div>
<ng-content select="elx-dialog-footer, [elx-dialog-footer]"></ng-content>

	`,
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

	@ContentChild(INITIAL_FOCUS_TARGET)
	_customFocusTarget?: Focusable;

	private _dragRef?: DragRef;
	private _focusTrap?: ConfigurableFocusTrap;

	private get _isBlocking() {
		return coerceBooleanProperty(this._blockingAttr)
			|| this.role === "alert";
	}

	constructor (
		private _dragDrop: DragDrop,
		@Inject(DOCUMENT) private _document: Document,
		private _elementRef: ElementRef<HTMLElement>,
		private _focusTrapFactory: ConfigurableFocusTrapFactory,
		private _globalFocusManager: GlobalFocusManager,
		@Attribute("blocking") private _blockingAttr: string,
	) {}

	ngOnInit(): void {
		if (this._isBlocking) {
			this._focusTrap = this._focusTrapFactory.create(
				this._elementRef.nativeElement,
				{ defer: true },
			);
		}
	}

	ngAfterContentInit(): void {
		if (this._heading) {
			this._dragRef = this._dragDrop
				.createDrag(this._elementRef)
				.withBoundaryElement(this._document.body)
				.withHandles([this._heading._elementRef]);
		}

		// TODO: Should we still auto-focus the first tabbable dialog element if
		// there's no focus trap?
		if (!this._focusTrap) return;

		let focusTarget = this._customFocusTarget ?? this._footer?.initialFocusTarget;
		if (focusTarget) {
			this._focusTrap.attachAnchors();
			setTimeout(() => {
				if (focusTarget && !(focusTarget as any)["disabled"])
					focusTarget.focus("keyboard");
				else
					this._focusTrap?.focusFirstTabbableElementWhenReady();
			});
		} else {
			this._focusTrap.attachAnchors();
			this._focusTrap.focusFirstTabbableElementWhenReady()
		}
	}

	ngOnDestroy(): void {
		this._focusTrap?.destroy();
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

	@ContentChild(INITIAL_FOCUS_TARGET)
	initialFocusTarget?: Focusable;
}
