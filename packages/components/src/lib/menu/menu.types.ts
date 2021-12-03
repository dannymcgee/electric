import { ElementRef, InjectionToken } from "@angular/core";
import type { MenuOverlayManager } from "./menu-overlay.service";
import type { MenuComponent } from "./menu.component";

export enum MenuKind {
	Menu,
	Context,
	Submenu,
}

export interface MenuTrigger {
	elementRef: ElementRef<HTMLElement>,
	menu: MenuComponent,
	overlay: MenuOverlayManager,
	initialize?(): void;
}

export const MENU_TRIGGER = new InjectionToken<MenuTrigger>("MenuTrigger");
export const MENUBAR = new InjectionToken("Menubar");
