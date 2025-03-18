import { Fn } from "./types";

type Key = string | number;

type ExhaustiveMatcher<Union extends Key>
	= Record<Union, () => unknown>

type MatcherWithFallback<Union extends Key>
	= Partial<Record<Union, () => unknown>>
	& { _: () => unknown }

type Matcher<Union extends Key>
	= ExhaustiveMatcher<Union>
	| MatcherWithFallback<Union>

export function match<K extends Key, T extends Matcher<K>>(
	subject: K,
	matcher: T,
): T[K] extends Fn<[], infer R> ? R
	: Extract<T, MatcherWithFallback<K>>["_"] extends Fn<[], infer R> ? R
	: never
{
	if (subject in matcher)
		return matcher[subject]!() as any;

	if ("_" in matcher)
		return matcher._() as any;

	throw new Error(`No match found for subject \`${subject}\` in matcher`);
}
