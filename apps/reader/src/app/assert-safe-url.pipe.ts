import { Pipe, PipeTransform } from "@angular/core";
import { DomSanitizer, SafeUrl } from "@angular/platform-browser";

@Pipe({
	name: "assertSafeUrl",
	pure: true,
})
export class AssertSafeUrlPipe implements PipeTransform {
	constructor (private _sanitizer: DomSanitizer) {}

	transform(url: string): SafeUrl {
		return this._sanitizer.bypassSecurityTrustUrl(url);
	}
}
