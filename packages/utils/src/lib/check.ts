import { Nullish, Opt } from "./types";

export function exists<T>(value?: Opt<T>): value is NonNullable<T> {
	return value != null;
}

type Truthy<T> = Exclude<T, "" | 0 | false | Nullish>;

export function isTruthy<T>(value?: T): value is Truthy<T> {
	return Boolean(value);
}
