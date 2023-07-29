import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	HostBinding,
	Input,
	OnChanges,
	OnDestroy,
	OnInit,
	SimpleChanges,
	ViewEncapsulation,
} from "@angular/core";
import { Subject, takeUntil } from "rxjs";

import { Font } from "../font";
import { Glyph } from "./glyph";
import { GlyphScaleFactorProvider } from "./glyph-scale-factor.service";
import { getViewBox, ViewBox } from "./viewbox.pipe";

@Component({
	selector: "svg[g-glyph-editor]",
	templateUrl: "./glyph-editor.component.svg",
	styleUrls: ["./glyph-editor.component.scss"],
	providers: [GlyphScaleFactorProvider],
	changeDetection: ChangeDetectionStrategy.OnPush,
	encapsulation: ViewEncapsulation.None,
})
export class GlyphEditorComponent implements OnChanges, OnInit, OnDestroy {
	@Input() glyph!: Glyph;

	@Input() metricsThickness = 1.5;

	@HostBinding("style.--path-thickness")
	@Input() pathThickness = 2;

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

	private _viewBox?: ViewBox;
	private _onDestroy$ = new Subject<void>();

	constructor (
		private _cdRef: ChangeDetectorRef,
		public _font: Font,
		private _scaleProvider: GlyphScaleFactorProvider,
	) {}

	ngOnChanges(changes: SimpleChanges): void {
		if ("glyph" in changes && this.glyph)
			this._viewBox = getViewBox(this._font, this.glyph);
	}

	ngOnInit(): void {
		this._scaleProvider.update(true);

		this._scaleProvider
			.scaleFactor$
			.pipe(takeUntil(this._onDestroy$))
			.subscribe(scaleFactor => {
				this._scaleFactor = scaleFactor;
				this._cdRef.markForCheck();
			})
	}

	ngOnDestroy(): void {
		this._onDestroy$.next();
		this._onDestroy$.complete();
	}
}
