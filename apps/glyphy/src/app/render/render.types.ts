import { InjectionToken } from "@angular/core";
import { assert, Opt } from "@electric/utils";
import { Observable } from "rxjs";

export interface RenderElement {
	readonly changes$: Observable<void>;
	onDraw(context: CanvasRenderingContext2D): void;
}

export type PaintStyle
	= string
	| CanvasGradient
	| CanvasPattern;

export type NormalizedSpacing = [
	top: number,
	right: number,
	bottom: number,
	left: number,
];

type Spacing_2Arg = [vertical: number, horizontal: number];
type Spacing_3Arg = [top: number, horizontal: number, bottom: number];
type Spacing_4Arg = NormalizedSpacing;
type Spacing_NArray
	= Spacing_2Arg
	| Spacing_3Arg
	| Spacing_4Arg;


export type Spacing
	= number
	| Spacing_2Arg
	| Spacing_3Arg
	| Spacing_4Arg
	| `${number}`
	| `${number} ${number}`
	| `${number} ${number} ${number}`
	| `${number} ${number} ${number} ${number}`;

export function normalizeSpacing(value?: Opt<Spacing>): NormalizedSpacing {
	if (value == null)
		return [0, 0, 0, 0];

	switch (typeof value) {
		case "number":
			return [value, value, value, value];

		case "string": {
			const n = Number(value);
			if (!Number.isNaN(n)) return [n, n, n, n];

			return normalizeSpacing(value.split(" ").map(Number) as Spacing_NArray);
		}

		case "object": {
			assert(Array.isArray(value));
			switch (value.length) {
				case 2: {
					const [v, h] = value;
					return [v, h, v, h];
				}
				case 3:
				case 4: {
					const [t, r, b, l] = value;
					return [t, r, b, l ?? r];
				}
			}
		}
	}
}

export const RENDER_ELEMENT = new InjectionToken<RenderElement>("RenderElement");
