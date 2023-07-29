import { Pipe, PipeTransform } from "@angular/core";
import { SafeHtml } from "@angular/platform-browser";

@Pipe({ name: "program" })
export class CffProgramPipe implements PipeTransform {
	transform(value: string | undefined): SafeHtml {
		if (!value) return "";

		return value
			.split("\n")
			.map(line => line.trim())
			.filter(Boolean)
			.map(line => line
				.split(/ +/)
				.map(token => {
					if (/^[-.0-9]+$/.test(token))
						return `<span class="numeric">${token}</span>`;
					return `<span class="instr">${token}</span>`;
				})
				.join(" ")
			)
			.join("\n");
	}
}
