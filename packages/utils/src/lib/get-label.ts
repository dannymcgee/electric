export function getLabel(element: HTMLElement): string {
	let result = [] as string[];
	element.childNodes.forEach(node => {
		accumLabel(node, result);
	});
	return result.join(" ");
}

function accumLabel(node: Node, accum: string[]): void {
	switch (node.nodeType) {
		case Node.TEXT_NODE: {
			if (node.nodeValue)
				accum.push(node.nodeValue.trim());
			break;
		}
		case Node.ELEMENT_NODE: {
			let element = node as Element;
			let attrs = element.attributes;

			if (attrs.getNamedItem("aria-hidden"))
				break;

			let ariaLabel: string | undefined;
			if ((ariaLabel = attrs.getNamedItem("aria-label")?.value)) {
				accum.push(ariaLabel);
				break;
			}

			node.childNodes.forEach(node => {
				accumLabel(node, accum)
			});

			break;
		}
	}
}
