import { animate, state, style, transition, trigger } from "@angular/animations";
import { EaseInOut, anim } from "@electric/style";

export const BLOCK_FIRST_ENTER_ANIM = trigger("blockFirstEnterAnim", [
	transition(":enter", []),
]);

export const ACCORDION_TRIGGER = trigger("accordion", [
	state("collapsed", style({
		height: 0,
		paddingTop: 0,
		paddingBottom: 0,
		opacity: 0,
	})),
	state("expanded", style({
		height: "*",
		paddingTop: "*",
		paddingBottom: "*",
		opacity: "*",
	})),
	transition("collapsed <=> expanded", [
		animate(`${anim.frameTime(6)}ms ${EaseInOut.Sine}`),
	]),
]);
