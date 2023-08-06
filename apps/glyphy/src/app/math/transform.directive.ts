import { Directive, HostBinding, Input } from "@angular/core";
import { exists } from "@electric/utils";

import { Matrix } from "./matrix";

@Directive({
	selector: "[gTransform]",
})
export class TransformDirective {
	@Input("gTransform")
	matrix?: Matrix | (Matrix | undefined)[];

	@HostBinding("style.transform")
	get transform() {
		if (!this.matrix) return null;

		if (Array.isArray(this.matrix))
			return Matrix
				.concat(...this.matrix.filter(exists))
				.toDomMatrix()
				.toString();

		return this.matrix.toDomMatrix().toString()
	}
}
