import { FocusOrigin, FocusOptions } from "@angular/cdk/a11y";
import { InjectionToken } from "@angular/core";

export interface Focusable {
	focus(origin?: FocusOrigin, options?: FocusOptions): void;
}

export const INITIAL_FOCUS_TARGET = new InjectionToken<Focusable>("InitialFocusTarget");
