import { Directive, ElementRef, Input, OnChanges } from "@angular/core";
import { assert, Const, instanceOf } from "@electric/utils";

import { Matrix } from "./matrix";
import { vec2 } from "./vec2";

@Directive({
	selector: "[gHybridCoordSpace]"
})
export class HybridCoordSpaceTransformDirective implements OnChanges {
	@Input() xTransform: Const<Matrix> = Matrix.Identity;
	@Input() yTransform: Const<Matrix> = Matrix.Identity;

	@Input() xPosition = 0;
	@Input() yPosition = 0;

	private get _element() { return this._ref.nativeElement; }

	constructor (
		private _ref: ElementRef<HTMLOrSVGElement>,
	) {}

	ngOnChanges(): void {
		const { x } = this.xTransform.transformPoint(this.xPosition, 0);
		const { y } = this.yTransform.transformPoint(0, this.yPosition);

		if (this._element instanceof HTMLElement) {
			this._element.style.setProperty("transform", `translate(${x}px, ${y}px)`);
		}
		else {
			assert(instanceOf(SVGElement)(this._element),
				"[gHybridCoordSpace] directive requires an HTMLElement or SVGElement host"
			);
			this._element.setAttribute("transform", `translate(${x}, ${y})`);
		}
	}
}
