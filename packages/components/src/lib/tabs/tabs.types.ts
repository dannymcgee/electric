import { FocusableOption } from "@angular/cdk/a11y";
import { EventEmitter, InjectionToken } from "@angular/core";
import { Observable } from "rxjs";

export type IndicatorPosition = "top" | "bottom";

export interface Tab extends FocusableOption {
	readonly role: "tab";
	id: string;
	readonly panelId: string;
	controls?: string;
	active: boolean;
	select: EventEmitter<void>;
	hoverChanges$: Observable<boolean>;
	width$: Observable<number>;
}

export const TAB = new InjectionToken<Tab>("Tab");
