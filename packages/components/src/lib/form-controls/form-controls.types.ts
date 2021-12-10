import { ControlValueAccessor } from "@angular/forms";

import { Fn } from "@electric/utils";
import { InjectionToken } from "@angular/core";

export interface ValueAccessor<T> extends ControlValueAccessor {
	writeValue(value?: T): void;
	registerOnChange(fn: Fn<[T?], void>): void;
	setDisabledState(value: boolean): void;
}

export interface FormControl {
	fieldId?: string;
}

export interface FormLabel {
	for?: string;
}

export const FORM_CONTROL = new InjectionToken<FormControl>("FormControl");
export const FORM_LABEL = new InjectionToken<FormLabel>("FormLabel");

export interface FieldSet {
	labelId?: string;
}

export interface Legend {
	id?: string;
}

export const FIELD_SET = new InjectionToken<FieldSet>("FieldSet");
export const LEGEND = new InjectionToken<Legend>("Legend");
