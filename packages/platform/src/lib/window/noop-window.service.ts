import { Injectable } from "@angular/core";
import { of } from "rxjs";

import { WindowProvider } from "./window.types";

@Injectable()
export class NoopWindowService implements WindowProvider {
	readonly maximized$ = of(false);
	readonly maximized = false;

	async minimize() {}
	async close() {}
	async toggleMaximized() {
		return false;
	}
}
