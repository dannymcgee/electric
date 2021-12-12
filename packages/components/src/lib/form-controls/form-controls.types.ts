import { ControlValueAccessor } from "@angular/forms";

import { Fn } from "@electric/utils";
import { InjectionToken } from "@angular/core";

export interface ValueAccessor<T> extends ControlValueAccessor {
	writeValue(value?: T): void;
	registerOnChange(fn: Fn<[T?], void>): void;
	setDisabledState(value: boolean): void;
}

export interface NativeControl {
	fieldId?: string;
}

export interface CustomControl {
	labelId?: string;
}

export interface FormLabel {
	id?: string;
	for?: string;
	useNative?: boolean;
}

export const NATIVE_CONTROL = new InjectionToken<NativeControl>("FormControl");
export const CUSTOM_CONTROL = new InjectionToken<CustomControl>("CustomControl");
export const FORM_LABEL = new InjectionToken<FormLabel>("FormLabel");
