import { array } from "@electric/utils";

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
