import { keys } from "./object";

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

/** All modifier keys */
export const MODIFIER_KEYS = keys(ModifierKey) as ModifierKey[];

/** All modifier keys, excluding "locks" (CapsLock, NumLock, etc.) */
export const MODIFIER_KEYS_NOLOCKS = MODIFIER_KEYS.filter(key => (
	key !== ModifierKey.CapsLock
	&& key !== ModifierKey.NumLock
	&& key !== ModifierKey.ScrollLock
	&& key !== ModifierKey.FnLock
	&& key !== ModifierKey.SymbolLock
));
