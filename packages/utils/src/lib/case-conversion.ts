// dprint-ignore
export enum Case {
	None   = 0b000000,
	Title  = 0b000001,
	Upper  = 0b000010,
	Camel  = 0b000100,
	Spaced = 0b001000,
	Kebab  = 0b010000,
	Snake  = 0b100000,
}

export function identifyCase(text: string): Case {
	let result = Case.None;

	if (/^[A-Z]/.test(text)) {
		result |= Case.Title;
	}

	let alphas = text.split("").filter(char => /[a-zA-Z]/.test(char));
	if (alphas.every(char => /[A-Z]/.test(char))) {
		result |= Case.Upper;
	} else if (!/[-_\s]/.test(text)) {
		result |= Case.Camel;
	}

	if (text.includes(" ")) result |= Case.Spaced;
	if (text.includes("-")) result |= Case.Kebab;
	if (text.includes("_")) result |= Case.Snake;

	return result;
}

export function camelToKebabCase(text: string): string {
	return text.replace(/([a-z])([A-Z0-9])/g, "$1-$2").toLowerCase();
}

export function kebabCase(text: string): string {
	let sourceCase = identifyCase(text);

	if (sourceCase & Case.Camel) {
		return camelToKebabCase(text);
	}

	return text
		.replace(/[^a-zA-Z0-9]/g, "-")
		.replace(/-+/g, "-")
		.toLowerCase();
}

export function titleCase(text: string): string {
	let sourceCase = identifyCase(text);

	if (sourceCase & Case.Camel) {
		let result = "";

		for (let i = 0; i < text.length; i++) {
			let char = text.charAt(i);

			if (i === 0) {
				result += char.toUpperCase();
			} else if (/[A-Z]/.test(char)) {
				result += ` ${char}`;
			} else {
				result += char;
			}
		}

		return result;
	}

	return text
		.replace(/[^a-zA-Z0-9]/g, " ")
		.replace(/ +/g, " ")
		.split(" ")
		.map(word =>
			word.split("")
				.map((char, idx) =>
					idx === 0
						? char.toUpperCase()
						: char.toLowerCase()
				)
				.join("")
		)
		.join(" ");
}

export function camelCase(text: string): string {
	let sourceCase = identifyCase(text);
	let result = text;

	if (sourceCase & Case.Camel) {
		if (sourceCase & Case.Title) {
			result = result.charAt(0).toLowerCase() + result.substring(1);
		}
		return result;
	}

	if (sourceCase & (Case.Kebab | Case.Snake | Case.Spaced)) {
		result = result
			.replace(/[^a-zA-Z0-9]/g, " ")
			.replace(/ +/g, " ")
			.split(" ")
			.map((word, w) =>
				word.split("")
					.map((char, c) =>
						c === 0 && w !== 0
							? char.toUpperCase()
							: char.toLowerCase()
					)
			)
			.join("");
	}

	return result;
}

export function pascalCase(text: string): string {
	let sourceCase = identifyCase(text);
	let result = text;

	if (sourceCase & Case.Camel) {
		if (!(sourceCase & Case.Title)) {
			result = result.charAt(0).toUpperCase() + result.substring(1);
		}
		return result;
	}

	if (sourceCase & (Case.Kebab | Case.Snake | Case.Spaced)) {
		result = result
			.replace(/[^a-zA-Z0-9]/g, " ")
			.replace(/ +/g, " ")
			.split(" ")
			.map(word =>
				word.split("")
					.map((char, c) =>
						c === 0
							? char.toUpperCase()
							: char.toLowerCase()
					)
					.join("")
			)
			.join("");
	}

	return result;
}

export function snakeCase(text: string): string {
	let sourceCase = identifyCase(text);

	if (sourceCase & Case.Camel) {
		return text.replace(/([a-z])([A-Z0-9])/g, "$1_$2").toLowerCase();
	}

	return text
		.replace(/[^a-zA-Z0-9]/g, "_")
		.replace(/_+/g, "_")
		.toLowerCase();
}
