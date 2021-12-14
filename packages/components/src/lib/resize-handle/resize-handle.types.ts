import { EventEmitter, InjectionToken } from "@angular/core";

export type Direction = "vertical" | "horizontal";
export type Alignment = "top" | "right" | "bottom" | "left";

export const RESIZE_HANDLE = new InjectionToken<ResizeHandle>("ResizeHandle");

export interface ResizeHandle {
	id?: string;
	direction?: Direction;
	align?: Alignment;
	move: EventEmitter<Vec2>;
}

export class Vec2 {
	static fromPointerEvent({ movementX, movementY }: PointerEvent) {
		return new Vec2(
			movementX / window.devicePixelRatio,
			movementY / window.devicePixelRatio,
		);
	}

	constructor (
		public x: number,
		public y: number,
	) {}
}
