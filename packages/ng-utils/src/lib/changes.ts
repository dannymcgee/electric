export interface OnChanges {
	ngOnChanges(changes: Changes<this>): void | Promise<void>;
}

export type Changes<T> = {
	[K in keyof T]?: Change<T[K]>;
}

export interface Change<T> {
	previousValue: T;
	currentValue: T;
	firstChange: boolean;
	isFirstChange(): boolean;
}
