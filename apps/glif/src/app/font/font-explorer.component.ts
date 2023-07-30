import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	HostBinding,
	OnDestroy,
	OnInit,
} from "@angular/core";
import { ElxResizeObserver, ResizeEntry } from "@electric/ng-utils";
import { anim } from "@electric/style";
import { debounceTime, Subject, takeUntil } from "rxjs";

import { FamilyService } from "../family";

@Component({
	selector: "g-font-explorer",
	templateUrl: "./font-explorer.component.html",
	styleUrls: ["./font-explorer.component.scss"],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FontExplorerComponent implements OnInit, OnDestroy {
	@HostBinding("style.--cols")
	cols = 12;

	get font$() { return this._familyService.font$; }

	private _onDestroy$ = new Subject<void>();

	constructor (
		private _cdRef: ChangeDetectorRef,
		private _elementRef: ElementRef<HTMLElement>,
		private _familyService: FamilyService,
		private _resizeObserver: ElxResizeObserver,
	) {}

	ngOnInit(): void {
		this._resizeObserver
			.observe(this._elementRef)
			.pipe(
				debounceTime(anim.frameTime(1)),
				takeUntil(this._onDestroy$),
			)
			.subscribe({
				next: entry => {
					this.onResize(entry);
				},
				complete: () => {
					this._resizeObserver.unobserve(this._elementRef);
				},
			});
	}

	ngOnDestroy(): void {
		this._onDestroy$.next();
		this._onDestroy$.complete();
	}

	private onResize(entry: ResizeEntry<HTMLElement>): void {
		const { width } = entry.contentRect;
		const glyphHeight = 96;
		const targetRatio = 7 / 8;
		/*
		   ratio = (width / cols) / glyphHeight
		       r = (w/c) / gh
		   r(gh) = w/c
		r(gh)(c) = w
		    r(c) = w/gh
		       c = (w/gh) / r
		*/
		const cols = Math.floor((width / glyphHeight) / targetRatio);
		if (cols !== this.cols) {
			this.cols = cols;
			this._cdRef.markForCheck();
		}
	}
}
