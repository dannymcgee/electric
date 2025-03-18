import { Opt } from "@electric/utils";

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace cursor {
	export function select(fallback = "default") {
		return `url("/assets/elx/cursors/Select.svg") 3 2, ${fallback}`;
	}

	export function pen(variant: Opt<string> = null, fallback = "default") {
		if (!variant)
			return `url("/assets/elx/cursors/Pen.svg") 3 2, ${fallback}`;

		return `url("/assets/elx/cursors/Pen_${variant}.svg") 3 2, ${fallback}`;
	}
}
