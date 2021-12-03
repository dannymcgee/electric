import {
	AfterViewInit,
	Directive,
	ElementRef,
	HostBinding,
	HostListener,
	Inject,
	Input,
	OnDestroy,
	Self,
} from "@angular/core";

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

	constructor (
		public elementRef: ElementRef<HTMLElement>,
		@Self() public overlay: MenuOverlayManager,
		private _coordinator: MenuCoordinator,
	) {}

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
})
export class ContextMenuTriggerDirective implements MenuTrigger, AfterViewInit {
	@Input("elxContextMenuTriggerFor")
	menu!: Menu;

	constructor (
		public elementRef: ElementRef<HTMLElement>,
		@Self() public overlay: MenuOverlayManager,
		private _coordinator: MenuCoordinator,
	) {}

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
})
export class SubmenuTriggerDirective implements MenuTrigger {
	@Input("elxSubmenuTriggerFor")
	menu!: Menu;

	@HostBinding("attr.aria-haspopup")
	readonly ariaHasPopup = "menu";

	constructor (
		public elementRef: ElementRef<HTMLElement>,
		@Self() public overlay: MenuOverlayManager,
		private _coordinator: MenuCoordinator,
		@Inject(MENU) private _parentMenu: Menu,
	) {}

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
