import { ElementRef, Injectable, OnDestroy } from "@angular/core";
import { ElxResizeObserver } from "@electric/ng-utils";
import { BehaviorSubject, distinctUntilChanged, Subject, takeUntil } from "rxjs";

import { FamilyService } from "../family";
import { nearlyEq } from "../math";

@Injectable()
export class GlyphScaleFactorProvider implements OnDestroy {
	get scaleFactor$() { return this._scaleFactor$.asObservable(); }
	get scaleFactor() { return this._scaleFactor$.value; }

	private _scaleFactor$ = new BehaviorSubject<number>(1);
	private _onDestroy$ = new Subject<void>();

	private _svg: SVGSVGElement;

	constructor (
		elementRef: ElementRef<SVGElement>,
		resizeObserver: ElxResizeObserver,
		private _family: FamilyService,
	) {
		let { nativeElement: element } = elementRef;
		if (element instanceof SVGSVGElement) {
			this._svg = element;
		}
		else if (element.ownerSVGElement) {
			this._svg = element.ownerSVGElement;
		}
		else {
			throw new Error("No provider for SVG element!");
		}

		resizeObserver
			.observe(this._svg)
			.pipe(
				distinctUntilChanged((prev, current) => nearlyEq(
					prev.contentRect.height,
					current.contentRect.height,
				)),
				takeUntil(this._onDestroy$),
			)
			.subscribe({
				next: () => {
					this.update();
				},
				complete: () => {
					resizeObserver.unobserve(this._svg);
				},
			});
	}

	ngOnDestroy(): void {
		this._onDestroy$.next();
		this._onDestroy$.complete();
		this._scaleFactor$.complete();
	}

	update(retry = false): void {
		if (!this._family.family) {
			if (retry) {
				requestAnimationFrame(() => {
					this.update();
				});
			}
			return;
		}

		const { ascender, descender } = this._family.family;
		const height = (ascender - descender) * 1.333333;
		const bounds = this._svg.getBoundingClientRect();

		const scale = height / bounds.height;

		if (Number.isFinite(scale) && !Number.isNaN(scale)) {
			this._scaleFactor$.next(scale);
		}
		else if (retry) {
			requestAnimationFrame(() => {
				this.update();
			});
		}
	}
}