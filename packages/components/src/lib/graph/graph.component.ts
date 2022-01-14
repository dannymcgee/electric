import { DOCUMENT } from "@angular/common";
import {
	Component,
	ViewEncapsulation,
	ChangeDetectionStrategy,
	HostBinding,
	HostListener,
	ElementRef,
	Inject,
	Input,
} from "@angular/core";
import { fromEvent, merge, Subject, takeUntil } from "rxjs";

import { Coerce, DetectChanges } from "@electric/ng-utils";
import { anim } from "@electric/style";

@Component({
	selector: "elx-graph",
	template: `

<div class="elx-graph__nodes"
	[style.transform]="_nodesXform"
	[style.transform-origin]="_nodesXformOrigin"
>
	<ng-content></ng-content>
	<div class="elx-graph__test"></div>
</div>

<div class="elx-graph__cursor-pos">
	{{
		(_cursorX - _offsetX) / _scale / cellSize | number:'1.0-0'
	}}, {{
		(_cursorY - _offsetY) / _scale / cellSize | number:'1.0-0'
	}}
</div>
<div class="elx-graph__scale">
	{{ _scale | number:'1.2-2' }}
</div>

	`,
	styleUrls: ["./graph.component.scss"],
	encapsulation: ViewEncapsulation.None,
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class GraphComponent {
	@HostBinding("class")
	readonly hostClass = "elx-graph";

	@HostBinding("style.background-size")
	get backgroundSize() {
		let cellSize = this.cellSize * this._scale;
		while (cellSize < this.cellSize) cellSize *= 2;

		let lg = ((this.cellSize * 128 * this._scale) + "px ").repeat(2).trim();
		let sm = (cellSize + "px ").repeat(2).trim();

		return [lg, sm, lg, sm].join(", ");
	}

	@HostBinding("style.background-position")
	get backgroundPosition() {
		let x = this._offsetX + "px";
		let y = this._offsetY + "px";

		return `${x} 0, ${x} 0, 0 ${y}, 0 ${y}`;
	}

	get _nodesXform() {
		return `
			scale(${this._scale})
			translateX(${this._offsetX}px)
			translateY(${this._offsetY}px)`
	}

	get _nodesXformOrigin() {
		return `${this._offsetX}px ${this._offsetY}px`;
	}

	@Input() @Coerce(Number) cellSize = 16;

	@DetectChanges() _offsetX = 0;
	@DetectChanges() _offsetY = 0;

	@Input() @Coerce(Number) minScale = 0.1;
	@Input() @Coerce(Number) maxScale = 2.0;
	@DetectChanges() _scale = 1.0;

	@DetectChanges() _cursorX = 0.0;
	@DetectChanges() _cursorY = 0.0;

	private _onDestroy$ = new Subject<void>();

	private get _element() { return this._elementRef.nativeElement; }

	constructor (
		@Inject(DOCUMENT) private _document: Document,
		private _elementRef: ElementRef<HTMLElement>,
	) {}

	@HostListener("wheel", ["$event"])
	onZoom({ deltaX, deltaY, deltaZ }: WheelEvent): void {
		// Get the raw delta of the wheel event (+/- 1);
		let rawDelta = Math.sign(deltaX + deltaY + deltaZ);
		// Scale by the current zoom level so the zooming feels roughly linear
		let delta = rawDelta * this._scale * -0.1;

		// Calculate the new scale
		let scale = this._scale + delta;
		let roundingFactor = scale >= 1 ? 10 : 100;
		scale = Math.round(scale * roundingFactor) / roundingFactor;
		scale = anim.clamp(scale, [this.minScale, this.maxScale]);

		// Bail if the difference ~= 0.0
		let deltaScale = this._scale - scale;
		if (Math.abs(deltaScale) < Number.EPSILON)
			return;

		// Center the transform on the cursor position
		this._offsetX += ((this._cursorX - this._offsetX) / this._scale) * deltaScale;
		this._offsetY += ((this._cursorY - this._offsetY) / this._scale) * deltaScale;

		this._scale = scale;
	}

	@HostListener("mousedown", ["$event"])
	onMousedown(event: MouseEvent): void {
		if (event.button !== 1) return;

		event.preventDefault();

		fromEvent<PointerEvent>(this._document, "pointermove").pipe(
			takeUntil(merge(
				fromEvent(this._document, "pointerup"),
				this._onDestroy$,
			)),
		).subscribe(event => {
			this._offsetX += event.movementX / window.devicePixelRatio;
			this._offsetY += event.movementY / window.devicePixelRatio;
		});
	}

	@HostListener("mousemove", ["$event"])
	onMousemove(event: MouseEvent): void {
		this._cursorX = event.clientX - this._element.offsetLeft;
		this._cursorY = event.clientY - this._element.offsetTop;
	}
}
