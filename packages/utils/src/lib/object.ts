import { Fn, Obj } from "./types";

export function keys<T extends Obj>(obj: T): Array<keyof T> {
	return Object.keys(obj);
}

type EntriesReturn<T> = T extends ReadonlyMap<infer K, infer V>
	? Array<[K, V]>
	: T extends Record<infer K, infer V>
	? Array<[K, V]>
	: never;

export function entries<K, V>(map: ReadonlyMap<K, V>): Array<[K, V]>;
export function entries<K, V>(map: Map<K, V>): Array<[K, V]>;
export function entries<T extends Obj>(obj: T): Array<[keyof T, T[keyof T]]>;

export function entries<K, V, T>(
	objOrMap: T | Map<K, V>,
): EntriesReturn<typeof objOrMap> {
	if (objOrMap instanceof Map) {
		return Array.from(objOrMap.entries());
	}
	// @ts-ignore
	return Object.entries(objOrMap);
}

type ValuesReturn<T> = T extends ReadonlyMap<any, infer V>
	? V[]
	: Array<T[keyof T]>;

export function values<K, V>(map: ReadonlyMap<K, V>): V[];
export function values<K, V>(map: Map<K, V>): V[];
export function values<T extends Obj>(obj: T): Array<T[keyof T]>;
export function values<K, V, T extends Obj>(
	objOrMap: T | Map<K, V>,
): ValuesReturn<typeof objOrMap> {
	if (objOrMap instanceof Map) {
		return Array.from(objOrMap.values());
	}
	return Object.values(objOrMap);
}

type MapValuesReturn<T, Callback> = Callback extends
	(value: T[keyof T], key: keyof T) => infer R ? Record<keyof T, R>
	: any;

export function mapValues<T extends Obj, V>(
	transform: Fn<[T[keyof T], keyof T], V>,
) {
	return (obj: T): MapValuesReturn<T, typeof transform> => {
		return keys(obj).reduce((accum, key) => ({
			...accum,
			[key]: transform(obj[key], key),
		}), obj);
	};
}

export function mapEntries<T extends Obj, R>(
	transform: Fn<[[keyof T, T[keyof T]]], R>,
) {
	return (obj: T): R[] => entries(obj).map(transform);
}
