/**
 * This is basically a noop -- it just returns the input without modification.
 * Its purpose is purely for syntax highlighting, e.g. via extensions like
 * [this one](https://marketplace.visualstudio.com/items?itemName=bierner.lit-html).
 *
 * @example
 * html`<div>Hooray, syntax highlighting!</div>`
 */
export function html(strings: TemplateStringsArray) {
	return strings.join("");
}
