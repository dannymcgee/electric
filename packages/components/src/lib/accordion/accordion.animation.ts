import { animate, state, style, transition, trigger } from "@angular/animations";

export const BLOCK_FIRST_ENTER_ANIM = trigger("blockFirstEnterAnim", [
	transition(":enter", []),
]);

export const ACCORDION_TRIGGER = trigger("accordion", [
	state("void", style({
		height: 0,
		paddingTop: 0,
		paddingBottom: 0,
		opacity: 0,
	})),
	state("*", style({
		height: "*",
		paddingTop: "*",
		paddingBottom: "*",
		opacity: "*",
	})),
	transition(":enter", [
		animate("100ms ease-in-out"),
	]),
	transition(":leave", [
		animate("67ms ease-out"),
	]),
]);
