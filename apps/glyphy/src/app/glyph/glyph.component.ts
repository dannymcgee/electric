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
import { Coerce } from "@electric/ng-utils";
import { Subject, takeUntil } from "rxjs";

import { FamilyService, FontMetrics } from "../family";
import { getViewBox, ViewBox } from "../util";
import { Glyph } from "./glyph";

@Component({
	selector: "svg[g-glyph]",
	templateUrl: "./glyph.component.svg",
	styleUrls: ["./glyph.component.scss"],
	changeDetection: ChangeDetectionStrategy.OnPush,
	encapsulation: ViewEncapsulation.None,
	standalone: false,
})
export class GlyphComponent implements OnChanges, OnInit, OnDestroy {
	@Input("g-glyph") glyph?: Glyph;

	@Coerce(Number)
	@Input() zoomFactor = 1.25;

	@Coerce(Boolean)
	@Input() showMetrics = false;

	@Input() upperBound: (number | keyof FontMetrics) = "ascender";
	@Input() lowerBound: (number | keyof FontMetrics) = "descender";

	@HostBinding("class")
	readonly hostClass = "g-glyph";

	@HostBinding("attr.fill")
	readonly fill = "currentColor";

	@HostBinding("attr.viewBox")
	get viewBoxAttr() {
		if (!this._viewBox) return "0 0 1000 1000";

		const { x, y, width, height } = this._viewBox;
		return `${x} ${y} ${width} ${height}`
	}

	_viewBox?: ViewBox;

	private _onDestroy$ = new Subject<void>();

	constructor (
		private _cdRef: ChangeDetectorRef,
		public _family: FamilyService,
	) {}

	ngOnChanges(changes: SimpleChanges): void {
		if (this.glyph && ("glyph" in changes || "zoomFactor" in changes)) {
			// TODO: This should be more reactive
			const font = this._family.font;
			if (!font) return;

			this._viewBox = getViewBox(
				font,
				this.glyph,
				this.zoomFactor,
				this.upperBound,
				this.lowerBound,
			);
		}
	}

	ngOnInit(): void {
		this.glyph?.outline?.changes$
			.pipe(takeUntil(this._onDestroy$))
			.subscribe(() => {
				this._cdRef.markForCheck();
			});
	}

	ngOnDestroy(): void {
		this._onDestroy$.next();
		this._onDestroy$.complete();
	}
}
