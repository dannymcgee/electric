import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
	name: "toggle",
	pure: true,
})
export class TogglePipe implements PipeTransform {
	transform(condition: boolean, value = ""): string | null {
		if (condition) return value;
		return null;
	}
}
