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
	transition("* <=> *", [
		animate("100ms ease-in-out"),
	]),
]);
