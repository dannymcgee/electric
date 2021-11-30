export type Obj = { [key: string]: any };
export type Predicate<T> = (item: T) => boolean;

export interface Fn<Args extends any[] = [], R = void> {
	(...args: Args): R;
}

export interface AsyncFn<Args extends any[] = [], R = void> {
	(...args: Args): Promise<R>;
}
