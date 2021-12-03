import { FocusableOption, FocusOrigin } from "@angular/cdk/a11y";
import { FlexibleConnectedPositionStrategyOrigin } from "@angular/cdk/overlay";
import {
	ElementRef,
	InjectionToken,
	QueryList,
	TemplateRef,
} from "@angular/core";
import { Observable } from "rxjs";

import type { MenuOverlayManager } from "./menu-overlay.service";

export enum MenuKind {
	Menu,
	Context,
	Submenu,
}

export interface MenuOverlayConfig {
	origin: FlexibleConnectedPositionStrategyOrigin;
	menuPanelClass?: string;
	encapsulationId?: string;
	orientation?: Orientation;
}

export type Orientation =
	| "vertical"
	| "horizontal";

export type MenuEvent =
	| MenuCloseEvent
	| MenuOpenEvent;

export interface MenuCloseEvent {
	isOpen: false;
}

export interface MenuOpenEvent {
	isOpen: true;
	originalEvent?: Event;
	focusOrigin: FocusOrigin;
	menuPanel: MenuPanel;
}

export interface MenuTrigger {
	readonly elementRef: ElementRef<HTMLElement>,
	readonly overlay: MenuOverlayManager,
	menu: Menu,
	initialize?(): void;
}

export interface Menu {
	readonly items: QueryList<MenuItem>;
	panelClass?: string;
	template?: TemplateRef<void>;
	encapsulationId?: string;
}

export interface MenuPanel {
	readonly elementRef: ElementRef<HTMLElement>,
}

export interface MenuItem extends FocusableOption {
	readonly role: "menuitem";
	readonly hasSubmenu: boolean;
	readonly elementRef: ElementRef<HTMLElement>;
	readonly focused$: Observable<MenuItemFocusEvent>;
	readonly pressed$: Observable<void>;
	readonly hovered$: Observable<HTMLElement>;
}

export interface MenuItemFocusEvent {
	item: MenuItem;
	element: HTMLElement;
	origin: FocusOrigin;
}

export const MENU = new InjectionToken<Menu>("Menu");
export const MENU_ITEM = new InjectionToken<MenuItem>("MenuItem");
export const MENU_TRIGGER = new InjectionToken<MenuTrigger>("MenuTrigger");
export const MENUBAR = new InjectionToken("Menubar");
