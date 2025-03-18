export function assert(
	condition: boolean,
	message?: string,
	...data: unknown[]
): asserts condition {
	if (!condition) {
		if (data.length) {
			setTimeout(() => console.error(...data));
		}
		throw new Error(message ?? "Assertion failed!");
	}
}

export function assertType<T>(value: unknown): asserts value is T {}
