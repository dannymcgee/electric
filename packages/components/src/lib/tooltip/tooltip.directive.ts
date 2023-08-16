import { ConnectedPosition, Overlay, OverlayRef } from "@angular/cdk/overlay";
import { ComponentPortal } from "@angular/cdk/portal";
import {
	Directive,
	ElementRef,
	HostListener,
	Input,
	OnDestroy,
	TemplateRef,
} from "@angular/core";
import { match, Option } from "@electric/utils";
import { fromEvent, race, Subject, take, takeUntil, timer } from "rxjs";

import { TooltipComponent } from "./tooltip.component";

export type TooltipPosition
	= "top"
	| "right"
	| "bottom"
	| "left";

@Directive({
	selector: "[elxTooltip]",
	exportAs: "elxTooltip",
})
export class TooltipDirective<Ctx extends Option<{ [key: string]: any }>>
	implements OnDestroy
{
	@Input("elxTooltip")
	content?: Option<TemplateRef<Ctx>>;

	@Input("elxTooltipContext")
	context?: Ctx;

	@Input("elxTooltipPosition")
	position: TooltipPosition | TooltipPosition[] = "top";

	@Input("elxTooltipDelay")
	delay = 400;

	get positions(): TooltipPosition[] {
		if (Array.isArray(this.position)) return this.position;
		return [this.position];
	}

	private _overlayPositions?: ConnectedPosition[];
	private get overlayPositions() {
		return this._overlayPositions ??= this.positions
			.map(position => match (position, {
				"top": () => ({
					originX: "center",
					overlayX: "center",
					originY: "top",
					overlayY: "bottom",
					offsetY: 8,
				} as const),
				"right": () => ({
					originX: "end",
					overlayX: "start",
					originY: "center",
					overlayY: "center",
					offsetX: 8,
				} as const),
				"bottom": () => ({
					originX: "center",
					overlayX: "center",
					originY: "bottom",
					overlayY: "top",
					offsetY: 8,
				} as const),
				"left": () => ({
					originX: "start",
					overlayX: "end",
					originY: "center",
					overlayY: "center",
					offsetX: 8,
				} as const),
			}));
	}

	private _overlayRef?: OverlayRef;
	private get overlayRef() {
		return this._overlayRef ??= this.createOverlayRef();
	}

	private _portal = new ComponentPortal(TooltipComponent);

	private _onDestroy$ = new Subject<void>();

	constructor (
		private _ref: ElementRef<Element>,
		private _overlay: Overlay,
	) {}

	ngOnDestroy(): void {
		this._onDestroy$.next();
		this._onDestroy$.complete();

		this.close();
		this._overlayRef?.dispose();
	}

	@HostListener("pointerenter")
	onPointerEnter(): void {
		const ptrLeave$ = fromEvent(this._ref.nativeElement, "pointerleave").pipe(
			take(1),
			takeUntil(this._onDestroy$),
		);

		timer(this.delay)
			.pipe(
				take(1),
				takeUntil(race(ptrLeave$, this._onDestroy$)),
			)
			.subscribe(() => {
				this.open();
			});
	}

	@HostListener("pointerleave")
	onPointerLeave(): void {
		this.close();
	}

	open(): void {
		if (this._portal.isAttached) return;
		if (!this.content) return;

		const ref = this._portal.attach(this.overlayRef);
		ref.instance.createEmbeddedView(this.content, this.context);
		ref.changeDetectorRef.markForCheck();
	}

	close(): void {
		if (this._portal.isAttached)
			this._portal.detach();
	}

	private createOverlayRef(): OverlayRef {
		return this._overlay.create({
			positionStrategy: this._overlay
				.position()
				.flexibleConnectedTo(this._ref)
				.withPositions(this.overlayPositions),
			scrollStrategy: this._overlay.scrollStrategies.close(),
		});
	}
}
