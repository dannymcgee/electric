import { Injectable } from "@angular/core";
import { assert, Fn, fromKeydown, isModifier, partition } from "@electric/utils";
import { Subscription } from "rxjs";

@Injectable({ providedIn: "root" })
export class KeybindRegistry {
	private _registry = new Map<string, Subscription[]>();

	register(keybind: string, handler: Fn<[KeyboardEvent?], any>) {
		if (this._registry.has(keybind))
			console.warn(`Duplicate binding registered for key shortcut ${keybind}`);
		else
			this._registry.set(keybind, []);

		const keys = keybind.split("+").map(s => s.trim());
		const [modifiers, primary] = partition(isModifier)(keys);
		assert(
			primary.length === 1,
			`Expected a single primary key in keybind "${keybind}", but found ${primary.length}.`
		);

		const subscription = fromKeydown(window, primary[0], modifiers).subscribe(handler);

		this._registry.get(keybind)!.push(subscription);
	}

	unregister(keybind: string) {
		if (this._registry.has(keybind)) {
			this._registry.get(keybind)!.forEach(sub => sub.unsubscribe());
			this._registry.delete(keybind);
		}
	}
}
