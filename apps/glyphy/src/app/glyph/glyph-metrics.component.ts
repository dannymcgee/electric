import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	HostBinding,
	Input,
	OnDestroy,
	OnInit,
	Optional,
	ViewEncapsulation,
} from "@angular/core";
import { Subject, takeUntil } from "rxjs";

import { FamilyService } from "../family";
import { ViewBox } from "../util";
import { Glyph } from "./glyph";
import { GlyphScaleFactorProvider } from "./glyph-scale-factor.service";

@Component({
	selector: "g[g-glyph-metrics]",
	templateUrl: "./glyph-metrics.component.svg",
	styleUrls: ["./glyph-metrics.component.scss"],
	changeDetection: ChangeDetectionStrategy.OnPush,
	encapsulation: ViewEncapsulation.None,
})
export class GlyphMetricsComponent implements OnInit, OnDestroy {
	@Input() glyph?: Glyph;
	@Input() lineThickness = 1;
	@Input() viewBox?: ViewBox;

	@Input()
	get scaleFactor() { return this._scaleFactor; }
	set scaleFactor(value) {
		this._scaleFactor = value;
		if (value != null) {
			this._strokeWidth = value * this.lineThickness;
			this._cdRef.markForCheck();
		}
	}
	private _scaleFactor?: number;

	@HostBinding("class")
	readonly hostClass = "g-glyph-metrics";

	@HostBinding("attr.stroke-width")
	@HostBinding("style.--stroke-width")
	_strokeWidth = 1;

	private _onDestroy$ = new Subject<void>();

	constructor (
		private _cdRef: ChangeDetectorRef,
		public _family: FamilyService,
		@Optional() private _scaleProvider: GlyphScaleFactorProvider,
	) {}

	ngOnInit(): void {
		this._scaleProvider
			?.scaleFactor$
			.pipe(takeUntil(this._onDestroy$))
			.subscribe(scaleFactor => {
				this._strokeWidth = scaleFactor * this.lineThickness;
				this._cdRef.markForCheck();
			});
	}

	ngOnDestroy(): void {
		this._onDestroy$.next();
		this._onDestroy$.complete();
	}
}
