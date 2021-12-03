import { InjectionToken } from "@angular/core";
import { ICONS } from "@electric/style";

export type IconSize =
	| "xs"
	| "sm"
	| "md"
	| "lg";

export type IconName = keyof typeof ICONS;

export const ICON_LIBRARY = new InjectionToken<Record<string, string>>("IconLibrary");
