export class Stack<T> extends Array<T> {
	constructor (private _capacity?: number) {
		super();
	}

	get top(): T | null {
		return this[this.length - 1];
	}

	get empty(): boolean {
		return this.length === 0;
	}

	override push(...items: T[]): number {
		super.push(...items);
		if (!this._capacity) return this.length;

		while (this.length > this._capacity) {
			this.shift();
		}
		return this.length;
	}

	clear(): void {
		this.length = 0;
	}
}
