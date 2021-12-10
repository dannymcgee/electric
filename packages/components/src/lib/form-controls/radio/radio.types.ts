import { EventEmitter, InjectionToken } from "@angular/core";

export interface Radio<T> {
	name?: string;
	value: T;
	disabled?: boolean;
	checked: boolean;
	checkedChange: EventEmitter<boolean>
}

export const RADIO = new InjectionToken<Radio<any>>("Radio");
