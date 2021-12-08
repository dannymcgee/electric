import { sleep } from "@electric/utils";
import { Spectator, SpectatorHost } from "@ngneat/spectator/jest";
import * as keycode from "keycode";

export class VirtualKeyboard<T extends Spectator<any> | SpectatorHost<any>> {
	private _spec?: T;

	constructor (spectator?: T) {
		this._spec = spectator;
	}

	press(key: KeyboardEvent["key"]): Promise<void> {
		let keyCode = getKeyCode(key);
		let options = {
			key,
			keyCode,
			bubbles: true,
			cancelable: true,
		};

		let target = document.activeElement ?? window;
		target.dispatchEvent(new KeyboardEvent("keydown", options));
		target.dispatchEvent(new KeyboardEvent("keyup", options));

		if (!this._spec) {
			return sleep(0);
		} else if ("hostFixture" in this._spec) {
			return this._spec.hostFixture.whenStable();
		} else {
			return this._spec.fixture.whenStable();
		}
	}
}

function getKeyCode(key: KeyboardEvent["key"]) {
	if (key.startsWith("Arrow")) {
		return keycode(key.replace("Arrow", ""));
	} else if (key === "Escape") {
		return keycode("esc");
	} else {
		return keycode(key);
	}
}
