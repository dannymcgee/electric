export function normalize(rawKeybind?: string): string {
	if (!rawKeybind) return "";

	return rawKeybind
		.split("+")
		.map(s => s.trim().replace(/^Ctrl$/i, "Control"))
		.join("+")
}
