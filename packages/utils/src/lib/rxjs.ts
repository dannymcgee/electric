import { ElementRef } from "@angular/core";
import { fromEvent, Observable } from "rxjs";
import { filter } from "rxjs/operators";

import { ModifierKey, MODIFIER_KEYS_NOLOCKS } from "./keys";
import { Predicate } from "./types";

export function fromKeydown(
	eventTarget: ElementRef<Element> | Element | Document | Window,
	primaryKey?: string | RegExp,
	modifiers?: ModifierKey[],
): Observable<KeyboardEvent> {
	let target = eventTarget instanceof ElementRef
		? eventTarget.nativeElement
		: eventTarget;
	let keydown$ = fromEvent<KeyboardEvent>(target, "keydown");

	if (primaryKey) {
		let predicate: Predicate<KeyboardEvent> =
			typeof primaryKey === "string"
				? evt => evt.key.toUpperCase() === primaryKey.toUpperCase()
				: evt => primaryKey.test(evt.key);

		keydown$ = keydown$.pipe(filter(predicate));
	}

	if (modifiers) {
		const excludedModifiers = MODIFIER_KEYS_NOLOCKS.filter(mod => !modifiers.includes(mod));

		keydown$ = keydown$.pipe(
			filter(evt => modifiers.every(included => evt.getModifierState(included))),
			filter(evt => !excludedModifiers.some(excluded => evt.getModifierState(excluded))),
		);
	}

	return keydown$;
}
