export function assert(
	condition: boolean,
	message?: string,
	...data: any[]
): asserts condition {
	if (!condition) {
		if (data.length) {
			setTimeout(() => console.error(...data));
		}
		throw new Error(message ?? "Assertion failed!");
	}
}

export function assertType<T>(object: unknown): asserts object is T {}
