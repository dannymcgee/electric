import { ControlValueAccessor } from "@angular/forms";

import { Fn } from "@electric/utils";
import { InjectionToken } from "@angular/core";

export interface FormControl<T> extends ControlValueAccessor {
	fieldId?: string;
	writeValue(value?: T): void;
	registerOnChange(fn: Fn<[T?], void>): void;
	setDisabledState(value: boolean): void;
}

export interface FormLabel {
	for?: string;
}

export const FORM_CONTROL = new InjectionToken<FormControl<any>>("FormControl");
export const FORM_LABEL = new InjectionToken<FormLabel>("FormLabel");
