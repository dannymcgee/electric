const VERTICAL_DEFAULT = {
	originX: "start",
	originY: "bottom",
	overlayX: "start",
	overlayY: "top",
	offsetY: 4,
} as const;

const VERTICAL_FALLBACK_VERTICAL = {
	originY: "top",
	overlayY: "bottom",
	offsetY: -4,
} as const;

const VERTICAL_FALLBACK_HORIZONTAL = {
	originX: "end",
	overlayX: "end",
} as const;

export const VERTICAL_POSITIONS = [{
	...VERTICAL_DEFAULT
}, {
	...VERTICAL_DEFAULT,
	...VERTICAL_FALLBACK_HORIZONTAL,
}, {
	...VERTICAL_DEFAULT,
	...VERTICAL_FALLBACK_VERTICAL,
}, {
	...VERTICAL_FALLBACK_VERTICAL,
	...VERTICAL_FALLBACK_HORIZONTAL,
}];

const HORIZONTAL_DEFAULT = {
	originX: "end",
	originY: "top",
	overlayX: "start",
	overlayY: "top",
	offsetX: 4,
	offsetY: -8,
} as const;

const HORIZONTAL_FALLBACK_VERTICAL = {
	originY: "bottom",
	overlayY: "bottom",
	offsetY: 8,
} as const;

const HORIZONTAL_FALLBACK_HORIZONTAL = {
	originX: "start",
	overlayX: "end",
	offsetX: -4,
} as const;

export const HORIZONTAL_POSITIONS = [{
	...HORIZONTAL_DEFAULT,
}, {
	...HORIZONTAL_DEFAULT,
	...HORIZONTAL_FALLBACK_VERTICAL,
}, {
	...HORIZONTAL_DEFAULT,
	...HORIZONTAL_FALLBACK_HORIZONTAL,
}, {
	...HORIZONTAL_FALLBACK_VERTICAL,
	...HORIZONTAL_FALLBACK_HORIZONTAL,
}];
