import { Injectable } from "@angular/core";
import { assert, fromKeydown, isModifier, partition } from "@electric/utils";
import { Subscription } from "rxjs";

import { normalize } from "./util";

export interface KeybindHandler {
	(event: KeyboardEvent): any;
}

@Injectable({ providedIn: "root" })
export class KeybindRegistry {
	private _registry = new Map<string, Map<KeybindHandler, Subscription>>();

	register(keybind: string, handler: KeybindHandler) {
		const normalized = normalize(keybind);

		if (!this._registry.has(normalized))
			this._registry.set(normalized, new Map());

		const keys = normalized.split("+").map(s => s.trim());
		const [modifiers, primary] = partition(isModifier)(keys);
		assert(
			primary.length === 1,
			`Expected a single primary key in keybind "${keybind}", but found ${primary.join(", ")}.`
		);

		const subscription = fromKeydown(window, primary[0], modifiers).subscribe(handler);

		this._registry.get(normalized)!.set(handler, subscription);
	}

	unregister(keybind: string, handler: KeybindHandler) {
		keybind = normalize(keybind);

		const subs = this._registry.get(keybind);
		if (!subs) return;

		const sub = subs.get(handler);
		if (!sub) return;

		sub.unsubscribe();
		subs.delete(handler);

		if (subs.size === 0)
			this._registry.delete(keybind);
	}

	unregisterAll(keybind: string): void {
		keybind = normalize(keybind);

		if (this._registry.has(keybind)) {
			this._registry.get(keybind)!.forEach(sub => sub.unsubscribe());
			this._registry.delete(keybind);
		}
	}
}
