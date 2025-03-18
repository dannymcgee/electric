import {
	AfterViewInit,
	Directive,
	HostBinding,
	HostListener,
	inject,
	Input,
	OnDestroy,
} from "@angular/core";

import { injectRef } from "@electric/ng-utils";

import { MenuCoordinator } from "./menu-coordinator.service";
import { MenuOverlayManager } from "./menu-overlay.service";
import {
	MENU,
	MENU_TRIGGER,
	Menu,
	MenuKind,
	MenuTrigger,
} from "./menu.types";

@Directive({
	selector: "[elxMenuTriggerFor]",
	providers: [
		{ provide: MENU_TRIGGER, useExisting: MenuTriggerDirective },
		MenuOverlayManager,
	],
	exportAs: "menuTrigger",
	standalone: false,
})
export class MenuTriggerDirective implements MenuTrigger, OnDestroy {
	@HostBinding("class")
	readonly hostClass = "elx-menu-trigger";

	@Input("elxMenuTriggerFor")
	menu!: Menu;

	@HostBinding("attr.aria-haspopup")
	readonly ariaHasPopup = "menu";

	@Input()
	get orientation() { return this.overlay.orientation }
	set orientation(value) { this.overlay.orientation = value }

	elementRef = injectRef<HTMLElement>();
	overlay = inject(MenuOverlayManager, { self: true });
	private _coordinator = inject(MenuCoordinator);

	ngOnDestroy(): void {
		this._coordinator.unregister(this);
	}

	@HostListener("mouseenter")
	@HostListener("focus")
	initialize(): void {
		this._coordinator.register(MenuKind.Menu, this, this.overlay);
		this.overlay.initialize({
			origin: this.elementRef,
			menuPanelClass: this.menu.panelClass,
			encapsulationId: this.menu.encapsulationId,
		});
	}
}

@Directive({
	selector: "[elxContextMenuTriggerFor]",
	providers: [
		{ provide: MENU_TRIGGER, useExisting: ContextMenuTriggerDirective },
		MenuOverlayManager,
	],
	standalone: false,
})
export class ContextMenuTriggerDirective implements MenuTrigger, AfterViewInit {
	@Input("elxContextMenuTriggerFor")
	menu!: Menu;

	elementRef = injectRef<HTMLElement>();
	overlay = inject(MenuOverlayManager, { self: true });
	private _coordinator = inject(MenuCoordinator);

	ngAfterViewInit(): void {
		this._coordinator.register(MenuKind.Context, this, this.overlay);
	}
}

@Directive({
	selector: "[elxSubmenuTriggerFor]",
	providers: [
		{ provide: MENU_TRIGGER, useExisting: SubmenuTriggerDirective },
		MenuOverlayManager,
	],
	standalone: false,
})
export class SubmenuTriggerDirective implements MenuTrigger {
	@Input("elxSubmenuTriggerFor")
	menu!: Menu;

	@HostBinding("attr.aria-haspopup")
	readonly ariaHasPopup = "menu";

	elementRef = injectRef<HTMLElement>();
	overlay = inject(MenuOverlayManager, { self: true });
	private _coordinator = inject(MenuCoordinator);
	private _parentMenu = inject(MENU);

	@HostListener("mouseenter")
	@HostListener("focus")
	initialize(): void {
		this._coordinator.register(
			MenuKind.Submenu,
			this,
			this.overlay,
			this._parentMenu,
		);
		this.overlay.initialize({
			origin: this.elementRef,
			menuPanelClass: this.menu.panelClass,
			encapsulationId: this.menu.encapsulationId,
			orientation: "horizontal",
		});
	}
}
