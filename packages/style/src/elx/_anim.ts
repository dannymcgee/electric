import { Fn } from "@electric/utils";
import { bezier } from "./internal/bezier";

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace anim {
	export function frameTime(frames: number): number {
		return frames / 30 * 1000;
	}

	export function lerp(t: number, [from, to]: [number, number]) {
		return (1 - t) * from + t * to;
	}

	export function invLerp(v: number, [from, to]: [number, number]) {
		return (v - from) / (to - from);
	}

	export function remap(
		v: number,
		from: [number, number],
		to: [number, number],
	) {
		let t = invLerp(v, from);
		return lerp(t, to);
	}

	export function clamp(n: number, [min, max]: [number, number]) {
		return Math.max(min, Math.min(n, max));
	}

	type Easing = EaseIn | EaseOut | EaseInOut;

	type EaseParams
		= [number, Easing]
		| [number, [number, number], Easing];

	export function ease(t: number, easing: Easing): number;
	export function ease(t: number, [from, to]: [number, number], easing: Easing): number;

	export function ease(...args: EaseParams): number {
		if (args.length === 2) {
			let [t, easing] = args;

			return easingFn(easing)(t);
		}

		let [t, [from, to], easing] = args;
		t = easingFn(easing)(t);

		return lerp(t, [from, to]);
	}

	const EASING_FUNCTIONS = new Map<Easing, Fn<[number], number>>();

	function easingFn(easing: Easing): Fn<[number], number> {
		if (!EASING_FUNCTIONS.has(easing)) {
			let values = easing
				.match(/^cubic-bezier\(((?:[0-9.]+,?\s*){4})\)/)![1]
				.split(", ")
				.map(parseFloat) as [number, number, number, number];

			EASING_FUNCTIONS.set(easing, bezier(...values));
		}
		return EASING_FUNCTIONS.get(easing)!;
	}
}

// dprint-ignore
export enum Duration {
	Micro  =  67,
	Short  = 133,
	Medium = 200,
	Long   = 400,
}

// dprint-ignore
export enum EaseIn {
	Sine  = "cubic-bezier(0.12, 0, 0.39, 0)",
	Quad  = "cubic-bezier(0.11, 0, 0.5,  0)",
	Cubic = "cubic-bezier(0.32, 0, 0.67, 0)",
}

// dprint-ignore
export enum EaseOut {
	Sine      = "cubic-bezier(0.61, 1, 0.88, 1)",
	Quad      = "cubic-bezier(0.5,  1, 0.89, 1)",
	Cubic     = "cubic-bezier(0.33, 1, 0.68, 1)",
	Quart     = "cubic-bezier(0.25, 1, 0.5,  1)",
	Quint     = "cubic-bezier(0.22, 1, 0.36, 1)",
	Expo      = "cubic-bezier(0.16, 1, 0.3,  1)",
	Circ      = "cubic-bezier(0, 0.55, 0.45, 1)",
	Overshoot = "cubic-bezier(0.34, 1.56, 0.64, 1)",
}

// dprint-ignore
export enum EaseInOut {
	Sine  = "cubic-bezier(0.37, 0, 0.63, 1)",
	Quad  = "cubic-bezier(0.45, 0, 0.55, 1)",
	Cubic = "cubic-bezier(0.65, 0, 0.35, 1)",
}
