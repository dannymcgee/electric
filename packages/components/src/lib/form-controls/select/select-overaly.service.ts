import {
	Overlay,
	OverlayRef,
	PositionStrategy,
	ViewportRuler,
} from "@angular/cdk/overlay";
import { ComponentPortal } from "@angular/cdk/portal";
import {
	ElementRef,
	Injectable,
	Injector,
	TemplateRef,
	ViewContainerRef,
} from "@angular/core";
import { animationFrames, merge, Subject, takeUntil } from "rxjs";

import { anim, EaseOut } from "@electric/style";
import { assert, sleep } from "@electric/utils";

import { OptionListComponent } from "./option-list/option-list.component";
import { OptionListOverlayData } from "./select-overlay-data.service";
import { ThemeService } from "../../theme/theme.service";

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
		private _data: OptionListOverlayData,
		private _theme: ThemeService,
		private _viewportRuler: ViewportRuler,
	) {}

	initialize({ origin, viewContainerRef, injector }: OverlayConfig): void {
		this._portal ??= new ComponentPortal(
			OptionListComponent,
			viewContainerRef,
			injector,
		);

		this._overlayRef ??= this._overlay.create({
			positionStrategy: new OptionListPositionStrategy(
				origin,
				this._data,
				this._theme,
				this._viewportRuler
			),
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
		if (this._portal?.isAttached) {
			this._overlayRef?.updatePosition();
		}
	}
}

/**
 * The option-list is designed to open "over" the select field, with the
 * selected option aligned with the field.
 *
 * For example, given the options [foo, bar, baz] for a select field
 * where 'bar' is currently selected, the option-list should open like so:
 *
 *           foo
 * [bar] -> [bar]
 *           baz
 *
 * When the selected option is cycled via the arrow keys while the menu is
 * opened, we update the menu's position - e.g., moving "up" from the previous
 * diagram, we would shift the menu down:
 *
 *  foo
 * [bar] -> [foo]
 *  baz      bar
 *           baz
 *
 * We also impose a configurable maximum displayed option count to keep the
 * screen real-estate occupied by the option-list reasonable. This complicates
 * the positioning logic described above, since the overlay can now be a limited
 * window into a subset of the total options.
 *
 * We handle this by offsetting the overlay as before when the selected option
 * is near the beginning or end of the list. When the selection is somewhere in
 * the middle, we keep the "window" centered over the field, and scroll the
 * option list behind it.
 *
 * E.g., given the options [lorem, ipsum, dolor, sit, amet], with a
 * `maxDisplayCount` of 3, this is how it would look to cycle through each
 * option in the menu:
 *                                                         dolor
 *                        lorem      ipsum      dolor      sit
 * [lorem] -> [lorem] -> [ipsum] -> [dolor] -> [sit  ] -> [amet ]
 *             ipsum      dolor      sit        amet
 *             dolor
 */
class OptionListPositionStrategy implements PositionStrategy {
	private _anchor?: HTMLElement;
	private _overlay?: HTMLElement;
	private _optionList?: HTMLElement;
	private _lens?: HTMLElement;

	private _offsetTop?: number;
	private _scrollTop?: number;
	private _lensY?: number;

	private _detach$ = new Subject<void>();

	constructor (
		private _origin: ElementRef<HTMLElement>,
		private _overlayData: OptionListOverlayData,
		private _theme: ThemeService,
		private _viewportRuler: ViewportRuler,
	) {}

	attach(overlayRef: OverlayRef): void {
		this._anchor = overlayRef.hostElement;
		this._overlay = overlayRef.overlayElement;

		let optionList = this._overlay.firstElementChild! as HTMLElement;
		let lens = document.createElement("div");
		lens.setAttribute("aria-hidden", "true");

		Object.assign(lens.style, {
			position: "absolute",
			top: 0,
			right: 0,
			left: 0,
			background: this._theme.getHex("accent", 100),
		});

		optionList.appendChild(lens);

		this._optionList = optionList;
		this._lens = lens;

		let { offsetTop, scrollTop, lensY } = this.calculateUiValues();

		this._offsetTop = offsetTop;
		this._scrollTop = scrollTop;
		this._lensY = lensY;
	}

	apply(): void {
		assert(this._overlayData != null);
		assert(this._origin != null);
		assert(this._anchor != null);
		assert(this._overlay != null);
		assert(this._optionList != null);
		assert(this._lens != null);

		// Position the anchor - this is the parent of the overlay pane, which
		// just serves as a static point of reference
		let { top, left } = this._origin.nativeElement.getBoundingClientRect();

		Object.assign(this._anchor.style, {
			position: "absolute",
			top: `${top}px`,
			bottom: 0,
			left: `${left}px`,
		});

		// Calculate and clamp the option-list's height
		let {
			optionHeight,
			optionCount,
			maxDisplayCount,
		} = this._overlayData;

		let viewportHeight = this._viewportRuler.getViewportSize().height;
		let height = Math.min(optionCount * optionHeight + 16, viewportHeight);

		let maxHeight = Math.min(
			maxDisplayCount * optionHeight + 16,
			viewportHeight,
		);

		// Calculate the new UI values
		let { offsetTop, scrollTop, lensY } = this.calculateUiValues();

		// Setup the start/end variables for the animation
		let otStart = this._offsetTop ?? offsetTop;
		let otNext = offsetTop;

		let stStart = this._scrollTop ?? scrollTop;
		let stNext = scrollTop;

		let lyStart = this._lensY ?? lensY;
		let lyNext = lensY;

		// Set the initial UI state for the animation
		let { offsetWidth } = this._origin.nativeElement;

		Object.assign(this._overlay.style, {
			height: `${height}px`,
			maxHeight: `${maxHeight}px`,
			position: "relative",
			top: `${otStart}px`,
			width: `${offsetWidth}px`,
		});

		this._optionList.scrollTop = stStart;

		Object.assign(this._lens.style, {
			height: `${optionHeight}px`,
		});

		// The animation needs to be done manually because the web animations API
		// doesn't support animating the `scrollTop` property. And since we're
		// hacking it for one property, we need to hack it for all of them to
		// keep them in sync throughout the animation.

		let duration = anim.frameTime(2);
		let done$ = new Subject<void>();

		animationFrames()
			.pipe(takeUntil(merge(done$, this._detach$)))
			.subscribe(({ elapsed }) => {
				let t = anim.clamp(
					anim.ease(elapsed / duration, EaseOut.Sine),
					[0, 1],
				);

				offsetTop = anim.lerp(t, [otStart, otNext]);
				scrollTop = anim.lerp(t, [stStart, stNext]);
				lensY = anim.lerp(t, [lyStart, lyNext]);

				this._overlay!.style.setProperty("top", `${offsetTop}px`);
				this._optionList!.scrollTop = scrollTop;
				this._lens!.style.setProperty(
					"transform",
					`translate3d(0px, ${lensY}px, 0px)`,
				);

				if (t === 1) {
					done$.next();
					done$.complete();

					this._offsetTop = otNext;
					this._scrollTop = stNext;
					this._lensY = lyNext;
				}
			});
	}

	detach(): void {
		this._detach$.next();
	}

	dispose(): void {}

	/**
	 * Calculate the `top` offset of the overlay pane,
	 * the `scrollTop` of the option-list,
	 * and the `y` offset of the selection "lens".
	 *
	 * See the doc comment at the top of this class for an explanation.
	 */
	private calculateUiValues() {
		let {
			activeIndex,
			optionHeight,
			optionCount,
			maxDisplayCount,
		} = this._overlayData;

		let offsetTop = 0;
		let scrollTop = 0;

		let len = Math.min(optionCount, maxDisplayCount);
		let middleIdx = Math.floor(len / 2);
		let maxScrollIdx = optionCount - Math.ceil(len / 2);

		if (activeIndex > middleIdx) {
			offsetTop = -middleIdx * optionHeight - 8;
			scrollTop = (activeIndex - middleIdx) * optionHeight;

			if (activeIndex > maxScrollIdx) {
				offsetTop -= (activeIndex - maxScrollIdx) * optionHeight;
			}
		} else {
			offsetTop = -activeIndex * optionHeight;
			if (activeIndex > -1) offsetTop -= 8;
		}

		let lensY = activeIndex * optionHeight;
		if (activeIndex > -1) lensY += 8;

		return { offsetTop, scrollTop, lensY };
	}
}
