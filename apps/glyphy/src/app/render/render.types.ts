import { InjectionToken } from "@angular/core";
import { Observable } from "rxjs";

export interface RenderHost {
	readonly update$: Observable<CanvasRenderingContext2D>;
}

export interface RenderElement {
	readonly changes$: Observable<void>;
	onDraw(context: CanvasRenderingContext2D): void;
}

export type PaintStyle
	= string
	| CanvasGradient
	| CanvasPattern;

export interface Rect {
	x: number;
	y: number;
	width: number;
	height: number;
}

export const RENDER_HOST = new InjectionToken<RenderHost>("RenderHost");
export const RENDER_ELEMENT = new InjectionToken<RenderElement>("RenderElement");
