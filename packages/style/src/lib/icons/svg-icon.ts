export class SvgIcon {
	private _validated = false;

	constructor (
		public content: string,
		private _document: Document,
	) {}

	validate(): void {
		if (this._validated) return;

		let svg = this.toElement();
		if (!svg.getAttribute("xmlns")) {
			svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
		}
		svg.setAttribute("fit", "");
		svg.setAttribute("height", "100%");
		svg.setAttribute("width", "100%");
		svg.setAttribute("preserveAspectRatio", "xMidYMid meet");

		this.content = svg.outerHTML;
		this._validated = true;
	}

	private toElement(): SVGElement {
		let outer = this._document.createElement("div");
		outer.innerHTML = this.content;

		let result = outer.querySelector("svg");
		if (!result) {
			throw new Error("<svg> tag missing from icon definition");
		}

		return result;
	}
}
