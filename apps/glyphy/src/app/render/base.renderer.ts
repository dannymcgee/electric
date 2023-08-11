import {
	Directive,
	EventEmitter,
	Input,
	OnChanges,
	Output,
} from "@angular/core";
import { ThemeService } from "@electric/components";
import { Option } from "@electric/utils";

import { Matrix, vec2 } from "../math";
import { PaintStyle, RenderElement } from "./render.types";

@Directive()
export abstract class BaseRenderer implements RenderElement, OnChanges {
	@Input() transform = Matrix.Identity;

	/** Transform that will only apply along the X dimension */
	@Input() xTransform = Matrix.Identity;
	/** Transform that will only apply along the Y dimension */
	@Input() yTransform = Matrix.Identity;

	@Input() fill?: Option<PaintStyle> = this.theme.getHex("foreground", 50);
	@Input() stroke?: Option<PaintStyle>;
	@Input() strokeWidth = 0;

	@Output("changes") changes$ = new EventEmitter<void>();

	constructor (
		protected theme: ThemeService,
	) {}

	ngOnChanges(): void {
		this.changes$.emit();
	}

	abstract onDraw(ctx: CanvasRenderingContext2D): void;

	protected transformX(value: number): number {
		if (this.xTransform === Matrix.Identity)
			return value * devicePixelRatio;

		return this.xTransform.transformPoint(vec2(value, 0)).x * devicePixelRatio;
	}

	protected transformY(value: number): number {
		if (this.yTransform === Matrix.Identity)
			return value * devicePixelRatio;

		return this.yTransform.transformPoint(vec2(0, value)).y * devicePixelRatio;
	}
}
