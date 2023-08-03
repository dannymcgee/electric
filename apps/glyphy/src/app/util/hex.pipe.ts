import { Pipe, PipeTransform } from "@angular/core";

@Pipe({ name: "hex" })
export class HexPipe implements PipeTransform {
	transform(value: number | undefined, pad?: number): string {
		if (value == null) return "";

		let result = value.toString(16).toUpperCase();
		while (result.length % (pad ?? 2))
			result = "0" + result;

		return result;
	}
}
