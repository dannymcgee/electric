import { array } from "@electric/utils";

/**
 * Query for an element in a Jest test environment.
 */
export function $(selector: string): HTMLElement | null;
export function $(receiver: Element, selector: string): HTMLElement | null;

export function $(...args: any[]) {
	switch (args.length) {
		case 1: return $_impl(document, args[0]);
		case 2: return $_impl(args[0], args[1]);
		default:
			throw new Error(
				`$ Overload for ${args.length} arguments is not implemented`
			);
	}
}

function $_impl(receiver: Document | Element, selector: string) {
	return receiver.querySelector<HTMLElement>(selector);
}

/**
 * Query for an array of elements in a Jest test environment.
 */
export function $$(selector: string): HTMLElement[];
export function $$(receiver: Element, selector: string): HTMLElement[];

export function $$(...args: any[]) {
	switch (args.length) {
		case 1: return $$_impl(document, args[0]);
		case 2: return $$_impl(args[0], args[1]);
		default:
			throw new Error(
				`$$ Overload for ${args.length} arguments is not implemented`
			);
	}
}

function $$_impl(receiver: Document | Element, selector: string) {
	return array(receiver.querySelectorAll<HTMLElement>(selector));
}
