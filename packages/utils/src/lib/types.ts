export type Obj = { [key: string]: any };
export type Predicate<T> = (item: T) => boolean;
export type TypePredicate<T, U extends T> = (item: T) => item is U;
export type Nullish = undefined | null | void;
export type Option<T> = Nullish | T;
export type Transparent<T> = {} & { [K in keyof T]: T[K]; };

export interface Fn<Args extends any[] = [], R = void> {
	(...args: Args): R;
}

export interface AsyncFn<Args extends any[] = [], R = void> {
	(...args: Args): Promise<R>;
}

export interface Ctor<T, Args extends any[] = []> {
	new (...args: Args): T;
}

export function instanceOf<T>(Type: Ctor<T, any[]>) {
	return (inst: unknown): inst is T => inst instanceof Type;
}

export type Const<T> = {
	readonly [K in keyof T]:
		T[K] extends Array<any> ? ConstMappedArray<T[K]> :
		T[K] extends Set<infer U> ? ReadonlySet<Const<U>> :
		T[K] extends Map<infer U, infer V> ? ReadonlyMap<U, Const<V>> :
		T[K] extends ((...args: any[]) => any) ? T[K] :
		T[K] extends Const<any> ? T[K] :
		T[K] extends { [key: string|number|symbol]: any } ? Const<T[K]> :
		T[K];
}

type ConstMappedArray<T extends any[]> = readonly [...{ [Idx in keyof T]: Const<T[Idx]> }];
