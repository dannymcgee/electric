import { Overlay, OverlayRef, PositionStrategy } from "@angular/cdk/overlay";
import { ComponentPortal } from "@angular/cdk/portal";
import {
	ElementRef,
	Injectable,
	Injector,
	TemplateRef,
	ViewContainerRef,
} from "@angular/core";
import { take } from "rxjs";

import { anim, EaseOut } from "@electric/style";
import { assert, sleep } from "@electric/utils";

import { OptionListComponent } from "./option-list/option-list.component";
import { OverlayData } from "./select-overlay-data.service";

export interface OverlayConfig {
	origin: ElementRef<HTMLElement>,
	viewContainerRef: ViewContainerRef,
	injector: Injector,
}

@Injectable()
export class SelectOverlayManager {
	private _portal?: ComponentPortal<OptionListComponent>;
	private _overlayRef?: OverlayRef;

	constructor (
		private _overlay: Overlay,
		private _data: OverlayData,
	) {}

	initialize({ origin, viewContainerRef, injector }: OverlayConfig): void {
		this._portal ??= new ComponentPortal(
			OptionListComponent,
			viewContainerRef,
			injector,
		);

		this._overlayRef ??= this._overlay.create({
			positionStrategy: new OptionListPositionStrategy()
				.connectedTo(origin)
				.withOverlayData(this._data),
			scrollStrategy: this._overlay.scrollStrategies.noop(),
		});
	}

	async open(id: string, template: TemplateRef<void>) {
		assert(this._portal != null);
		assert(this._overlayRef != null);

		if (this._portal.isAttached) return;

		let optionList = this._portal.attach(this._overlayRef).instance;
		optionList.id = id;
		optionList.template = template;

		await sleep(0);

		return optionList;
	}

	close(): void {
		if (this._portal?.isAttached) {
			this._portal.detach();
		}
	}

	updatePosition(): void {
		this._overlayRef?.updatePosition();
	}
}

class OptionListPositionStrategy implements PositionStrategy {
	private _origin?: ElementRef<HTMLElement>
	private _overlayData?: OverlayData;
	private _anchor?: HTMLElement;
	private _overlay?: HTMLElement;

	connectedTo(origin: ElementRef<HTMLElement>) {
		this._origin = origin;
		return this;
	}

	withOverlayData(data: OverlayData) {
		this._overlayData = data;
		return this;
	}

	attach(overlayRef: OverlayRef): void {
		this._anchor = overlayRef.hostElement;
		this._overlay = overlayRef.overlayElement;
	}

	apply(): void {
		assert(this._overlayData != null);
		assert(this._origin != null);

		let { top, left } = this._origin.nativeElement.getBoundingClientRect();
		let { offsetWidth } = this._origin.nativeElement;
		let { activeIndex$, optionHeight } = this._overlayData;

		activeIndex$.pipe(take(1)).subscribe(activeIdx => {
			assert(this._anchor != null);
			assert(this._overlay != null);

			let overlayTop = -activeIdx * optionHeight;
			if (activeIdx > -1) {
				overlayTop -= 8;
			}

			Object.assign(this._anchor.style, {
				position: "absolute",
				top: `${top}px`,
				left: `${left}px`,
			});

			Object.assign(this._overlay.style, {
				position: "relative",
				top: `${overlayTop}px`,
				width: `${offsetWidth}px`,
				transition: `top ${anim.frameTime(2)}ms ${EaseOut.Sine}`,
			});
		});
	}

	detach(): void {}

	dispose(): void {}
}
