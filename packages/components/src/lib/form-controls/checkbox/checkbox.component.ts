import { FocusMonitor } from "@angular/cdk/a11y";
import {
	ChangeDetectionStrategy,
	Component,
	ElementRef,
	EventEmitter,
	HostBinding,
	HostListener,
	Input,
	OnDestroy,
	OnInit,
	Output,
	ViewEncapsulation,
} from "@angular/core";
import { NG_VALUE_ACCESSOR } from "@angular/forms";
import { Subject, takeUntil } from "rxjs";

import { Coerce, DetectChanges } from "@electric/ng-utils";
import { elementId, Fn } from "@electric/utils";

import { ValueAccessor } from "../form-controls.types";

@Component({
	selector: "elx-checkbox",
	template: `

<div class="elx-checkbox__checkbox"
	[class.elx-checkbox__checkbox--checked]="checked"
>
	<input class="elx-checkbox__input"
		type="checkbox"
		[id]="id"
		[disabled]="disabled"
		[checked]="checked"
		(change)="onChange(!checked)"
		(click)="$event.stopImmediatePropagation()"
	/>
	<elx-icon class="elx-checkbox__icon"
		*ngIf="checked"
		icon="Confirm"
		size="sm"
	></elx-icon>
</div>
<label class="elx-checkbox__label"
	[attr.for]="id"
><ng-content></ng-content></label>

	`,
	styleUrls: ["./checkbox.component.scss"],
	providers: [{
		provide: NG_VALUE_ACCESSOR,
		useExisting: CheckboxComponent,
		multi: true,
	}],
	encapsulation: ViewEncapsulation.None,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckboxComponent
implements ValueAccessor<boolean>, OnInit, OnDestroy {
	@HostBinding("class")
	readonly hostClass = "elx-checkbox";

	@Input() id = elementId("checkbox");

	@HostBinding("attr.id")
	readonly _idFix = null;

	@HostBinding("class.checked")
	@Coerce(Boolean)
	@DetectChanges()
	@Input() checked = false;
	@Output() checkedChange = new EventEmitter<boolean>();

	@HostBinding("class.disabled")
	@DetectChanges()
	@Input() disabled?: boolean;

	@HostBinding("class.focus")
	@DetectChanges()
	_focused?: boolean;

	private _deferredValueChange?: boolean;
	private _deferredOnTouch?: boolean;

	private _onDestroy$ = new Subject<void>();

	constructor (
		private _elementRef: ElementRef<HTMLElement>,
		private _focusMonitor: FocusMonitor,
	) {}

	ngOnInit(): void {
		this._focusMonitor
			.monitor(this._elementRef, true)
			.pipe(takeUntil(this._onDestroy$))
			.subscribe(origin => {
				this._focused = origin === "keyboard";
				if (origin === null) {
					this._onTouched();
				}
			});
	}

	ngOnDestroy(): void {
		this._focusMonitor.stopMonitoring(this._elementRef);
		this._onDestroy$.next();
		this._onDestroy$.complete();
	}

	writeValue(value?: boolean): void {
		this.checked = value ?? false;
	}

	onChange(value: boolean): void {
		this._onChange(value);
		this.checked = value;
		this.checkedChange.emit(value);
	}

	private _onChange = (value?: boolean) => {
		this._deferredValueChange = value;
	}

	registerOnChange(fn: Fn<[boolean?], void>): void {
		this._onChange = fn;
		if (this._deferredValueChange != null) {
			fn(this._deferredValueChange);
		}
	}

	private _onTouched = () => {
		this._deferredOnTouch = true;
	}

	registerOnTouched(fn: Fn<[], void>): void {
		this._onTouched = fn;
		if (this._deferredOnTouch) {
			fn();
		}
	}

	setDisabledState(value: boolean): void {
		this.disabled = value;
	}

	@HostListener("click")
	toggle(): void {
		this.onChange(!this.checked);
	}
}
