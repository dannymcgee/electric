import * as keycode from "keycode";

import { array } from "./array";
import { sleep } from "./sleep";

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

/**
 * Returns a formatted string of all HTML and text contents of a DOM node.
 * Can be useful for sanity-check console logs while writing tests,
 * since you can't just inspect the DOM with devtools.
 */
export function printDomTree(node: Node, indent = 0): string {
	let indentText = "  ";
	let indents: string = Array(indent)
		.fill(indentText)
		.join("");

	let content = "";
	if (node instanceof Element) {
		if (/script|style|link/i.test(node.tagName)) {
			return content;
		}

		let classContent = node.className ? ` class="${node.className}"` : "";
		content += `<${node.tagName.toLowerCase()}${classContent}`;

		let atts = array(node.attributes)
			.filter(attr => attr.name !== "class");

		if (atts.length) {
			for (let attr of atts) {
				content += `\n${indents}${indentText}`;
				content += `${attr.name}="${attr.value}"`;
			}
			content += `\n${indents}`;
		}
		content += ">";
	} else if (node instanceof Text) {
		content = node.textContent?.trim() ?? "";
	}

	let result = content ? `\n${indents}${content}` : "";

	indent++;
	let childContent = "";

	for (let child of array(node.childNodes)) {
		childContent += printDomTree(child, indent);
	}

	result += childContent;

	if (node instanceof Element) {
		if (childContent) {
			result += `\n${indents}`;
		}
		result += `</${node.tagName.toLowerCase()}>`;
	}

	return result;
}

interface PrintableEvent {
	type: string;
	target?: string;
	path?: string[];
}

/**
 * Serializes an event to a compact, terminal-friendly format for debugging in
 * a Jest test environment.
 */
export function printableEvent(event: Event): PrintableEvent {
	let result: PrintableEvent = {
		type: event.type,
	};

	if (event.target && isElement(event.target)) {
		result.target = printElementCompact(event.target);
	}

	result.path = event
		.composedPath()
		.filter(isElement)
		.map(printElementCompact);

	return result;
}

function isElement(target: EventTarget): target is HTMLElement {
	return target instanceof HTMLElement;
}

function printElementCompact(element: HTMLElement) {
	let tag = element.tagName.toLowerCase();
	let textContent = element.textContent?.trim();
	if (textContent) {
		return `<${tag}>${textContent}</${tag}>`;
	}
	return `<${tag} />`;
}

export namespace keyboard {
	/**
	 * Emit a realistic synthetic keypress within a Jest test environment.
	 */
	export function press(key: KeyboardEvent["key"]) {
		let keyCode = getKeyCode(key);
		let options = {
			key,
			keyCode,
			bubbles: true,
			cancelable: true,
		};

		let target = document.activeElement ?? window;
		target.dispatchEvent(new KeyboardEvent("keydown", options));
		target.dispatchEvent(new KeyboardEvent("keyup", options));

		return sleep(0);
	}

	function getKeyCode(key: KeyboardEvent["key"]) {
		if (key.startsWith("Arrow")) {
			return keycode(key.replace("Arrow", ""));
		} else if (key === "Escape") {
			return keycode("esc");
		} else {
			return keycode(key);
		}
	}
}
