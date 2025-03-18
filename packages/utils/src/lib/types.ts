export type u8 = number;
export type i8 = number;
export type u16 = number;
export type i16 = number;
export type u32 = number;
export type i32 = number;
export type u64 = number;
export type i64 = number;
export type int = number;
export type uint = number;
export type f32 = number;
export type f64 = number;
export type FWORD = number;
export type UFWORD = number;

export type Key = PropertyKey;
export type Obj = { [key: Key]: unknown };

export type Pred<T> = (value: T) => boolean;
export type TypePred<T> = (value: unknown) => value is T;
export type TypeNarrow<T, U extends T> = (value: T) => value is U;

export type Nullish = undefined | null | void;
export type Opt<T> = Nullish | T;
export type Transparent<T> = {} & { [K in keyof T]: T[K]; };

export interface Fn<Args extends unknown[] = [], R = void> {
	(...args: Args): R;
}

export interface AsyncFn<Args extends unknown[] = [], R = void> {
	(...args: Args): Promise<R>;
}

export interface Ctor<T, Args extends unknown[] = []> {
	new (...args: Args): T;
}

export function instanceOf<T>(Type: Ctor<T, any[]>) {
	return (inst: unknown): inst is T => inst instanceof Type;
}

export type Const<T> = {
	readonly [K in keyof T]:
		T[K] extends Array<unknown> ? ConstMappedArray<T[K]> :
		T[K] extends Set<infer U> ? ReadonlySet<Const<U>> :
		T[K] extends Map<infer U, infer V> ? ReadonlyMap<U, Const<V>> :
		T[K] extends ((...args: unknown[]) => unknown) ? T[K] :
		T[K] extends Const<unknown> ? T[K] :
		T[K] extends { [key: string|number|symbol]: unknown } ? Const<T[K]> :
		T[K];
}

type ConstMappedArray<T extends unknown[]> = readonly [
	...{ [Idx in keyof T]: Const<T[Idx]> }
];
