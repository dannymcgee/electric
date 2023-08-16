export namespace cursor {
	export function select(fallback = "default") {
		return `url("/assets/elx/cursors/Select.svg") 3 2, ${fallback}`;
	}

	export function pen(fallback = "default") {
		return `url("/assets/elx/cursors/Pen.svg") 3 2, ${fallback}`;
	}
}
