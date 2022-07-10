import { Pipe, PipeTransform } from "@angular/core";
import { Entry } from "@tidy-api";

@Pipe({
	name: "filetype",
})
export class FileTypePipe implements PipeTransform {
	transform(entry?: Entry): string {
		if (!entry) return "folder";

		if (entry.type === "folder" || entry.type === "symlink")
			return entry.type;

		return entry.basename.match(/\.(.+?)$/)?.[1] ?? entry.basename;
	}
}
