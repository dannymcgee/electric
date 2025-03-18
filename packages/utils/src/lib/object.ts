import { Fn, Obj } from "./types";

export function keys<T extends object>(obj: T): Array<keyof T> {
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-expect-error
	return Object.keys(obj);
}

type EntriesReturn<T> = T extends ReadonlyMap<infer K, infer V>
	? Array<[K, V]>
	: T extends Record<infer K, infer V>
	? Array<[K, V]>
	: never;

export function entries<K, V>(map: ReadonlyMap<K, V>): Array<[K, V]>;
export function entries<K, V>(map: Map<K, V>): Array<[K, V]>;
export function entries<T extends object>(obj: T): Array<[keyof T, T[keyof T]]>;

export function entries<K, V, T>(objOrMap: T | Map<K, V>): EntriesReturn<typeof objOrMap> {
	if (objOrMap instanceof Map)
		return Array.from(objOrMap.entries());

	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-expect-error
	return Object.entries(objOrMap);
}

export function values<K, V>(map: ReadonlyMap<K, V>): V[];
export function values<K, V>(map: Map<K, V>): V[];
export function values<T extends object>(obj: T): Array<T[keyof T]>;
export function values(objOrMap: any): any {
	if (objOrMap instanceof Map)
		return Array.from(objOrMap.values());

	return Object.values(objOrMap);
}

type MapValuesReturn<T, Callback>
	= T extends object
		? Callback extends (value: T[keyof T], key: keyof T & infer K) => infer R
			? { [Key in K as PropertyKey]: R }
			: any // TODO
		: any; // TODO

export function mapValues<T extends object, V>(
	transform: Fn<[T[keyof T], keyof T], V>,
) {
	return (obj: T): MapValuesReturn<T, typeof transform> => {
		return keys(obj).reduce((accum, key) => ({
			...accum,
			[key]: transform(obj[key], key),
		}), obj) as unknown as MapValuesReturn<typeof obj, typeof transform>;
	};
}

export function mapEntries<T extends Obj, R>(
	transform: Fn<[[keyof T, T[keyof T]]], R>,
) {
	return (obj: T): R[] => entries(obj).map(transform);
}
