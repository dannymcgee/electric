export function regex(
	strings: TemplateStringsArray,
	...values: (RegExp | string)[]
) {
	let src: string = strings.raw.reduce((accum, curr) => {
		accum += curr;

		let value = values.shift();
		if (typeof value === "string") accum += value;
		else if (value) accum += value.source;

		return accum;
	}, "");

	let endIdx = src.lastIndexOf("/");
	let flags = src.substring(endIdx + 1);
	src = src.substring(0, endIdx).replace(/^\//, "");

	try {
		return new RegExp(src, flags);
	} catch (err) {
		if (err.message.includes("Nothing to repeat")) {
			return src;
		}
		throw err;
	}
}
