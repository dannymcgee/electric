import { Directive, Input, OnChanges } from "@angular/core";
import { injectRef } from "@electric/ng-utils";
import { assert, Const, instanceOf } from "@electric/utils";

import { Matrix } from "./matrix";

@Directive({
	selector: "[gHybridCoordSpace]",
	standalone: false,
})
export class HybridCoordSpaceTransformDirective implements OnChanges {
	@Input() xTransform: Const<Matrix> = Matrix.Identity;
	@Input() yTransform: Const<Matrix> = Matrix.Identity;

	@Input() xPosition = 0;
	@Input() yPosition = 0;

	private _ref = injectRef<HTMLOrSVGElement>();
	private get _element() { return this._ref.nativeElement; }

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
