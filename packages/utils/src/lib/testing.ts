import * as keycode from "keycode";

import { array } from "./array";
import { sleep } from "./sleep";

/**
 * Query for an element in a Jest test environment.
 */
export function $(selector: string) {
	return document.querySelector<HTMLElement>(selector);
}

/**
 * Query for an array of elements in a Jest test environment.
 */
export function $$(selector: string) {
	return array(document.querySelectorAll<HTMLElement>(selector));
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
