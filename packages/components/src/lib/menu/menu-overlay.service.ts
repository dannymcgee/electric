import { FocusOrigin } from "@angular/cdk/a11y";
import { coerceElement } from "@angular/cdk/coercion";
import {
	ConnectedPosition,
	FlexibleConnectedPositionStrategyOrigin as PositionStrategyOrigin,
	Overlay,
	OverlayRef,
} from "@angular/cdk/overlay";
import { ComponentPortal } from "@angular/cdk/portal";
import { ElementRef, Injectable, OnDestroy, TemplateRef } from "@angular/core";
import { Subject } from "rxjs";
import { share } from "rxjs/operators";

import { GlobalFocusManager } from "@electric/ng-utils";
import { assert } from "@electric/utils";

import { MenuPanelComponent } from "./menu-panel/menu-panel.component";
import { HORIZONTAL_POSITIONS, VERTICAL_POSITIONS } from "./menu.positions";
import { MenuEvent, MenuOverlayConfig, Orientation } from "./menu.types";

@Injectable()
export class MenuOverlayManager implements OnDestroy {
	get orientation() { return this._orientation }
	set orientation(value) {
		this._orientation = value;
		this._positions = value === "vertical"
			? VERTICAL_POSITIONS
			: HORIZONTAL_POSITIONS;
	}
	private _orientation: Orientation = "vertical";

	private _events$ = new Subject<MenuEvent>();
	private _onDestroy$ = new Subject<void>();

	readonly events$ = this._events$.pipe(share());

	private _positions: ConnectedPosition[] = VERTICAL_POSITIONS;
	private _origin?: PositionStrategyOrigin;
	private _originElement?: HTMLElement;
	private _overlayRef?: OverlayRef;
	private _portal = new ComponentPortal(MenuPanelComponent);
	private _menuPanel?: MenuPanelComponent;
	private get _panelElement() { return this._menuPanel?.elementRef.nativeElement }
	private _panelClass?: string;
	private _encapsulationId?: string;

	private get _positionStrategy() {
		assert(this._origin != null);

		return this._overlay
			.position()
			.flexibleConnectedTo(this._origin)
			.withPositions(this._positions)
	}

	constructor (
		private _overlay: Overlay,
		private _globalFocusManager: GlobalFocusManager,
	) {}

	ngOnDestroy(): void {
		this._onDestroy$.next();
		this._onDestroy$.complete();
		this._events$.complete();
		this.detach();
		this._overlayRef?.dispose();
	}

	initialize({
		origin,
		menuPanelClass,
		encapsulationId,
		orientation,
	}: MenuOverlayConfig): void {
		if (this._overlayRef) {
			if (this._origin !== origin) {
				this.updatePositionStrategy(origin);
			}
			return;
		}

		this._origin = origin;
		if (origin instanceof ElementRef || origin instanceof Element) {
			this._originElement = coerceElement(origin);
		}

		if (menuPanelClass) this._panelClass = menuPanelClass;
		if (encapsulationId) this._encapsulationId = encapsulationId;
		if (orientation) this.orientation = orientation;

		this._overlayRef = this._overlay.create({
			positionStrategy: this._positionStrategy,
		});
	}

	open(template: TemplateRef<void>): void;
	open(template: TemplateRef<void>, event: Event): void;
	open(template: TemplateRef<void>, focusOrigin: FocusOrigin): void;

	open(
		template: TemplateRef<void>,
		eventOrOrigin?: Event | FocusOrigin
	): void {
		if (this._portal.isAttached) return;

		assert(this._overlayRef != null);

		let [origin, element, event] = coerceEventOrigin(eventOrOrigin);
		if (element && !this._originElement) this._originElement = element;

		this._menuPanel = this._portal.attach(this._overlayRef).instance;
		setClasses(this._panelElement, this._panelClass, this._encapsulationId);
		this._menuPanel.template = template;

		setTimeout(() => {
			this._events$.next({
				isOpen: true,
				originalEvent: event,
				focusOrigin: origin ?? null,
				menuPanel: this._menuPanel!,
			});
		});
	}

	close(): void {
		this.detach();
		this._events$.next({ isOpen: false });

		setTimeout(() => {
			this._globalFocusManager
				.getLastValidFocusTarget()
				?.focus();
		});
	}

	private updatePositionStrategy(origin: PositionStrategyOrigin): void {
		this._origin = origin;
		this._overlayRef?.updatePositionStrategy(this._positionStrategy);
	}

	private detach(): void {
		if (this._portal.isAttached) {
			this._portal.detach();
		}
	}
}

function coerceEventOrigin(
	eventOrOrigin?: Event | FocusOrigin,
): [FocusOrigin?, HTMLElement?, Event?] {
	let [origin, element, event]: [FocusOrigin?, HTMLElement?, Event?] = [];
	if (!eventOrOrigin) return [];

	if (typeof eventOrOrigin === "string") {
		return [eventOrOrigin];
	}

	origin = isFromKeyboard(eventOrOrigin)
		? "keyboard"
		: "program";

	element = eventOrOrigin.target instanceof HTMLElement
		? eventOrOrigin.target
		: undefined;

	event = eventOrOrigin;

	return [origin, element, event];
}

function isFromKeyboard(event?: Event): boolean {
	return (
		event instanceof KeyboardEvent
		|| event instanceof MouseEvent && (
			event.x === 0 && event.y === 0
			|| event?.type === "contextmenu" && event.button === 0
		)
	);
}

function setClasses(
	element?: HTMLElement,
	classes?: string,
	encapsulationId?: string,
): void {
	if (!element) return;

	if (classes) {
		element.classList.add(...classes.split(" "));
	}

	if (encapsulationId) {
		element.setAttribute(`_ngcontent-${encapsulationId}`, "");
	}
}
