export type ElementId = string;

/**
 * Generates a unique-ish ID fast. Intended use case is for DOM element IDs and
 * similar situations where you don't need something as robust as a UUID.
 */
export function elementId(prefix?: string): ElementId {
	let random = () => Math.round(Math.random() * Date.now()).toString(16);
	let pre = prefix ?? random();

	return `${pre}-${random()}`;
}
