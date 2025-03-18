import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	HostBinding,
	inject,
	Input,
	ViewEncapsulation,
} from "@angular/core";

import { FamilyService } from "../family";
import { ViewBox } from "../util";
import { Glyph } from "./glyph";

@Component({
	selector: "g[g-glyph-metrics]",
	templateUrl: "./glyph-metrics.component.svg",
	styleUrls: ["./glyph-metrics.component.scss"],
	changeDetection: ChangeDetectionStrategy.OnPush,
	encapsulation: ViewEncapsulation.None,
	standalone: false,
})
export class GlyphMetricsComponent {
	@Input() glyph?: Glyph;
	@Input() viewBox?: ViewBox;

	@HostBinding("style.--line-thickness")
	@Input() lineThickness = 1;

	@HostBinding("style.--scale-factor")
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

	private _cdRef = inject(ChangeDetectorRef);
	_family = inject(FamilyService);
}
