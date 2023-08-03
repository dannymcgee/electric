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
