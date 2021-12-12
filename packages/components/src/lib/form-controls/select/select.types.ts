import { EventEmitter, InjectionToken, TemplateRef } from "@angular/core";

export interface Option<T> {
	id: string;
	readonly role: "option";
	readonly elementHeight: number;
	template: TemplateRef<void>;
	value?: T;
	select: EventEmitter<Option<T>>;
}

export const OPTION = new InjectionToken<Option<any>>("Option");
