import { InjectionToken } from "@angular/core";
import { Observable } from "rxjs";

export interface RenderElement {
	readonly changes$: Observable<void>;
	onDraw(context: CanvasRenderingContext2D): void;
}

export type PaintStyle
	= string
	| CanvasGradient
	| CanvasPattern;

export const RENDER_ELEMENT = new InjectionToken<RenderElement>("RenderElement");
