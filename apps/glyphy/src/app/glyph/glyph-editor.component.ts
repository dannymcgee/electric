import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	HostBinding,
	HostListener,
	Input,
	OnChanges,
	OnDestroy,
	SimpleChanges,
	ViewEncapsulation,
} from "@angular/core";
import { Subject, takeUntil } from "rxjs";

import { Glyph } from "./glyph";
import { GlyphScaleFactorProvider } from "./glyph-scale-factor.service";
import { FamilyService } from "../family";
import { getViewBox, ViewBox } from "../util/viewbox";

@Component({
	selector: "svg[g-glyph-editor]",
	templateUrl: "./glyph-editor.component.svg",
	styleUrls: ["./glyph-editor.component.scss"],
	providers: [GlyphScaleFactorProvider],
	changeDetection: ChangeDetectionStrategy.OnPush,
	encapsulation: ViewEncapsulation.None,
})
export class GlyphEditorComponent implements OnChanges, OnDestroy {
	@Input() glyph!: Glyph;

	@Input() metricsThickness = 1;

	@HostBinding("style.--path-thickness")
	@Input() pathThickness = 1;

	@HostBinding("style.--handle-thickness")
	@Input() handleThickness = 1;

	@HostBinding("class")
	readonly hostClass = "g-glyph-editor";

	@HostBinding("attr.viewBox")
	get viewBoxAttr() {
		if (!this._viewBox) return "0 0 1000 1000";

		const { x, y, width, height } = this._viewBox;
		return `${x} ${y} ${width} ${height}`
	}

	@HostBinding("style.--scale-factor")
	_scaleFactor = 1;

	_viewBox?: ViewBox;
	private _onDestroy$ = new Subject<void>();

	constructor (
		private _cdRef: ChangeDetectorRef,
		public _familyService: FamilyService,
		private _scaleProvider: GlyphScaleFactorProvider,
	) {}

	ngOnChanges(changes: SimpleChanges): void {
		if ("glyph" in changes && this.glyph) {
			this.updateViewbox();

			if (changes["glyph"].firstChange) {
				this._scaleProvider
					.scaleFactor$
					.pipe(takeUntil(this._onDestroy$))
					.subscribe(scaleFactor => {
						this._scaleFactor = scaleFactor;
						this._cdRef.detectChanges();
					});

				this._scaleProvider.update(true);
			}
		}
	}

	ngOnDestroy(): void {
		this._onDestroy$.next();
		this._onDestroy$.complete();
	}

	private updateViewbox(): void {
		this._viewBox = getViewBox(this._familyService.font!, this.glyph, 1.333333);
		this._cdRef.detectChanges();
	}

	@HostListener("window:resize")
	onResize(): void {
		this.updateViewbox();
		this._scaleProvider.update();
	}
}
