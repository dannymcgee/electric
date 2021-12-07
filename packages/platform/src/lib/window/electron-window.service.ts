import { Injectable } from "@angular/core";
import { Observable } from "rxjs";

import { WindowProvider } from "./window.types";

@Injectable()
export class ElectronWindowService implements WindowProvider {
	maximized$!: Observable<boolean>;
	maximized!: boolean;

	minimize(): Promise<void> {
		throw new Error("Method not implemented.");
	}

	close(): Promise<void> {
		throw new Error("Method not implemented.");
	}

	toggleMaximized(): Promise<boolean> {
		throw new Error("Method not implemented.");
	}
}
