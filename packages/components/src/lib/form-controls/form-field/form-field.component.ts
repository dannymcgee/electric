import {
	Component,
	ViewEncapsulation,
	ChangeDetectionStrategy,
	HostBinding,
	ChangeDetectorRef,
	ContentChild,
	DoCheck,
	Input,
	OnDestroy,
} from "@angular/core";
import { NgControl, ValidationErrors } from "@angular/forms";

import { Coerce } from "@electric/ng-utils";
import { elementId } from "@electric/utils";
import { map, Observable, startWith, Subject, takeUntil, tap } from "rxjs";

import {
	CustomControl,
	CUSTOM_CONTROL,
	FormLabel,
	FORM_LABEL,
	NativeControl,
	NATIVE_CONTROL,
} from "../form-controls.types";

@Component({
	selector: "elx-form-field",
	templateUrl: "./form-field.component.html",
	styleUrls: ["./form-field.component.scss"],
	encapsulation: ViewEncapsulation.None,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormFieldComponent implements DoCheck, OnDestroy {
	@HostBinding("class")
	readonly hostClass = "elx-form-field";

	@HostBinding("class.inline")
	@Coerce(Boolean)
	@Input() inline = false;

	@ContentChild(NATIVE_CONTROL)
	private _nativeControl?: NativeControl;

	@ContentChild(CUSTOM_CONTROL)
	private _customControl?: CustomControl;

	@ContentChild(FORM_LABEL)
	private _label?: FormLabel;

	@ContentChild(NgControl)
	private _control?: NgControl;

	_status$?: Observable<"VALID"|"INVALID"|"PENDING"|"DISABLED">;
	_validationErrors$?: Observable<ValidationErrors | null>;
	_touched = false;

	private _onDestroy$ = new Subject<void>();

	constructor (
		private _changeDetector: ChangeDetectorRef,
	) {}

	ngDoCheck(): void {
		if (this._label && this._nativeControl) {
			this.linkNativeControlAndLabel();
		} else if (this._label && this._customControl) {
			this.linkCustomControlAndLabel();
		}

		if (this._control?.statusChanges && !this._status$) {
			this._status$ = this._control.statusChanges.pipe(
				startWith(this._control.status),
				tap(() => this._changeDetector.markForCheck()),
				takeUntil(this._onDestroy$),
			);
			this._validationErrors$ = this._status$.pipe(
				map(() => this._control?.errors ?? null),
			);

			this._status$.subscribe();
		}

		if (this._control?.touched && !this._touched
			|| !this._control?.touched && this._touched)
		{
			this._touched = this._control?.touched ?? false;
			this._changeDetector.markForCheck();
		}
	}

	ngOnDestroy(): void {
		this._onDestroy$.next();
		this._onDestroy$.complete();
	}

	private linkNativeControlAndLabel(): void {
		if (
			this._label!.for && this._nativeControl!.fieldId
			&& this._label!.for === this._nativeControl!.fieldId
		) {
			return;
		}

		let id = this._nativeControl!.fieldId || elementId("form-control");
		if (this._nativeControl!.fieldId !== id) {
			this._nativeControl!.fieldId = id;
		}
		this._label!.for = id;
		this._label!.useNative = true;

		this._changeDetector.detectChanges();
	}

	private linkCustomControlAndLabel(): void {
		if (
			this._label!.id && this._customControl!.labelId
			&& this._label!.id === this._customControl!.labelId
		) {
			return;
		}

		let id = this._label!.id || elementId("form-label");
		if (this._label!.id !== id) {
			this._label!.id = id;
		}
		this._customControl!.labelId = id;
		this._label!.useNative = false;

		this._changeDetector.detectChanges();
	}
}
