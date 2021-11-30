import { ElementRef } from "@angular/core";
import { fromEvent, Observable } from "rxjs";
import { filter } from "rxjs/operators";
import { Predicate } from "./types";

export enum ModifierKey {
	Alt = "Alt",
	AltGraph = "AltGraph",
	CapsLock = "CapsLock",
	Control = "Control",
	Fn = "Fn",
	FnLock = "FnLock",
	Hyper = "Hyper",
	Meta = "Meta",
	NumLock = "NumLock",
	ScrollLock = "ScrollLock",
	Shift = "Shift",
	Super = "Super",
	Symbol = "Symbol",
	SymbolLock = "SymbolLock",
}

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
		keydown$ = keydown$.pipe(
			filter(evt => modifiers.every(mod => evt.getModifierState(mod))),
		);
	}

	return keydown$;
}
