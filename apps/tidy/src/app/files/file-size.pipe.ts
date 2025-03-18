import { Pipe, PipeTransform } from "@angular/core";

const KB = 1024;
const MB = 1024 * KB;
const GB = 1024 * MB;
const TB = 1024 * GB;

@Pipe({
	name: "filesize",
	standalone: false,
})
export class FileSizePipe implements PipeTransform {
	transform(size: number): string {
		if (!size) return "";
		if (size > TB) return `${(size / TB).toFixed(2)} TB`;
		if (size > GB) return `${(size / GB).toFixed(2)} GB`;
		if (size > MB) return `${(size / MB).toFixed(2)} MB`;
		if (size > KB) return `${(size / KB).toFixed(2)} KB`;

		return `${size} B`;
	}
}
