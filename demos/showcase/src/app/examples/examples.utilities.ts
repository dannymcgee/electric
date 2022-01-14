import { array } from "@electric/utils";

export function html(strings: TemplateStringsArray, ...values: any[]) {
	let markup = interpolate(strings, ...values);
	let doc = new DOMParser().parseFromString(markup, "text/html");

	return [array(doc.body.childNodes)];
}

export function template(strings: TemplateStringsArray, ...values: any[]) {
	return interpolate(strings, ...values);
}

function interpolate(strings: TemplateStringsArray, ...values: any[]) {
	return strings.raw.reduce((accum, current, idx) => {
		accum += current;
		if (idx < values.length) {
			accum += values[idx]?.toString();
		}
		return accum;
	}, "");
}
