import { assert } from "./assert";
import { Fn, Pred, TypeNarrow } from "./types";

type Collection<T> = T extends Element ? HTMLCollectionOf<T>
	: Iterable<T> | ArrayLike<T>;

export function array<T extends Element>(collection: HTMLCollectionOf<T>): T[];
export function array<T>(collection: Iterable<T> | ArrayLike<T>): T[];
export function array<T>(collection: Collection<T>): T[] {
	if (collection instanceof Array) {
		return collection;
	}
	return Array.from(collection);
}

export function last<T>(array: T[]): T {
	return array[array.length - 1];
}

export function partition<T, U extends T>(predicate: TypeNarrow<T, U>): Fn<[Iterable<T>], [U[], T[]]>;
export function partition<T>(predicate: Pred<T>): Fn<[Iterable<T>], [T[], T[]]>;

export function partition<T>(predicate: Pred<T>) {
	return (collection: Iterable<T>): [T[], T[]] => {
		let subsetA: T[] = [];
		let subsetB: T[] = [];

		for (let item of collection) {
			if (predicate(item)) {
				subsetA.push(item);
			} else {
				subsetB.push(item);
			}
		}

		return [subsetA, subsetB];
	};
}

export function sort<T>(compare: Fn<[T, T], number>) {
	return (collection: Iterable<T>): T[] => {
		let arr = collection instanceof Array
			? collection.slice()
			: Array.from(collection);

		return arr.sort(compare);
	};
}

type KeyedBy<T extends object, K extends keyof T>
	= T[K] extends PropertyKey
	? Record<T[K], T>
	: never;

export function keyBy<T extends object, K extends keyof T>
	(key: K): (coll: Iterable<T>) => KeyedBy<T, K>;

export function keyBy<T extends object, K extends keyof T>
	(key: K, coll: Iterable<T>): KeyedBy<T, K>;

export function keyBy<T extends object, K extends keyof T>(key: K, coll?: Iterable<T>) {
	if (!coll) return (coll: Iterable<T>) => keyBy_impl(key, coll);
	return keyBy_impl(key, coll);
}

function keyBy_impl<T extends object, K extends keyof T>(key: K, coll: Iterable<T>) {
	let result = {} as KeyedBy<T, K>;
	for (let element of coll) {
		assert(key in element && /(^string|number|symbol$)/.test(typeof element[key]));
		result[element[key]] = element as KeyedBy<T, K>[T[K]];
	}

	return result;
}

export function map<T, R>(transform: Fn<[T, number?], R>) {
	return (collection: Iterable<T>): R[] => array(collection).map(transform);
}

export function filter<T, U extends T>(pred: TypeNarrow<T, U>): (arr: readonly T[]) => U[]
export function filter<T, U extends T>(pred: TypeNarrow<T, U>, arr: readonly T[]): U[]
export function filter<T>(pred: Pred<T>): (arr: readonly T[]) => T[]
export function filter<T>(pred: Pred<T>, arr: readonly T[]): T[]
export function filter<T>(pred: Pred<T>, arr?: readonly T[]) {
	if (arr) return arr.filter(pred)
	return (arr: readonly T[]) => arr.filter(pred)
}

export function replaceAt<T>(index: number, newItem: T) {
	return (array: T[]) => array.map((item, i) => i === index ? newItem : item);
}

export function removeAt<T>(index: number) {
	return (array: T[]) => array.filter((_, i) => i !== index);
}
