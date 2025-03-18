import { Directive, HostBinding, Input } from "@angular/core";
import { Const, exists } from "@electric/utils";

import { Matrix } from "./matrix";

@Directive({
	selector: "[gTransform]",
	standalone: false,
})
export class TransformDirective {
	@Input("gTransform")
	matrix?: Const<Matrix> | (Const<Matrix> | undefined)[];

	@HostBinding("style.transform")
	get transform() {
		if (!this.matrix) return null;

		if (Array.isArray(this.matrix))
			return Matrix
				.concat(...this.matrix.filter(exists))
				.toCssString();

		return this.matrix.toCssString()
	}
}
