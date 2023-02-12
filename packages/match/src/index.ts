interface Fn<Args extends unknown[] = [], R = void> {
	(...args: Args): R
}

type Key = string | number

export type ExhaustiveMatcher<Union extends Key>
	= Record<Union, () => any>

export type MatcherWithFallback<Union extends Key>
	= Partial<Record<Union, () => any>>
	& { _: () => any }

export type Matcher<Union extends Key>
	= ExhaustiveMatcher<Union>
	| MatcherWithFallback<Union>

export default function match<K extends Key, T extends Matcher<K>>(
	subject: K,
	matcher: T,
): T[keyof T] extends Fn<[], infer R> ? R : never {
	if (subject in matcher)
		return matcher[subject]!()

	if ("_" in matcher)
		return matcher._()

	throw new Error(`No match found for subject \`${subject}\` in matcher`)
}
