import { ElementRef } from "@angular/core";
import {
	animationFrameScheduler,
	filter,
	fromEvent,
	map,
	MonoTypeOperatorFunction,
	Observable,
	pipe,
	scan,
	scheduled,
	shareReplay,
	takeUntil,
} from "rxjs";
import { ShareReplayConfig } from "rxjs/internal/operators/shareReplay";

import { ModifierKey, MODIFIER_KEYS_NOLOCKS } from "./keys";
import { Opt, Pred } from "./types";

export function fromKeydown(
	eventTarget: ElementRef<Element> | Element | Document | Window,
	primaryKey?: string | RegExp,
	modifiers?: ModifierKey[],
): Observable<KeyboardEvent> {
	let target = eventTarget instanceof ElementRef
		? eventTarget.nativeElement
		: eventTarget;
	let keydown$ = fromEvent<KeyboardEvent>(target, "keydown");

	if (primaryKey) {
		let predicate: Pred<KeyboardEvent> =
			typeof primaryKey === "string"
				? evt => evt.key.toUpperCase() === primaryKey.toUpperCase()
				: evt => primaryKey.test(evt.key);

		keydown$ = keydown$.pipe(filter(predicate));
	}

	if (modifiers) {
		const excludedModifiers = MODIFIER_KEYS_NOLOCKS.filter(mod => !modifiers.includes(mod));

		keydown$ = keydown$.pipe(
			filter(evt => modifiers.every(included => evt.getModifierState(included))),
			filter(evt => !excludedModifiers.some(excluded => evt.getModifierState(excluded))),
		);
	}

	return keydown$;
}

export function replayUntil<T>(
	notifier$: Observable<unknown>,
	config?: ShareReplayConfig,
): MonoTypeOperatorFunction<T> {
	config ??= { refCount: false };
	config.bufferSize ??= 1;

	return pipe(
		shareReplay(config),
		takeUntil(notifier$),
	);
}

export function animationFrames() {
	return scheduled(endless(), animationFrameScheduler);
}

function* endless(): Generator<void> {
	while (true) yield;
}

export interface DeltaOptions<T> {
	/** A function that subtracts `rhs` from `lhs` to find the difference. */
	diff(lhs: T, rhs: T): T,
	/** A value that represents no change. */
	zero: T,
}

/**
 * Convert a stream of values that change over time into a stream of the deltas
 * between those values.
 *
 * @example
 * ```typescript
 * import { delta } from "@electric/utils";
 * import { of } from "rxjs";
 *
 * of(1, 2, 3, 4, 5)
 * 	.pipe(delta())
 * 	.subscribe(v => {
 * 		console.log(`delta: ${v}`);
 * 	});
 *
 * // Logs:
 * // delta: 0
 * // delta: 1
 * // delta: 1
 * // delta: 1
 * // delta: 1
 * ```
 */
export function delta(options?: Partial<DeltaOptions<number>>): MonoTypeOperatorFunction<number>;

/**
 * Convert a stream of values that change over time into a stream of the deltas
 * between those values.
 *
 * @param options must be provided if `T` is not `number`
 *
 * @example
 * ```typescript
 * import { delta } from "@electric/utils";
 * import { fromEvent, map } from "rxjs";
 *
 * fromEvent(window, "pointermove").pipe(
 * 	map(event => [event.clientX, event.clientY]),
 * 	delta({
 * 		diff: ([x1, y1], [x2, y2]) => [x1-x2, y1-y2],
 * 		zero: [0, 0],
 * 	}),
 *	);
 * ```
 */
export function delta<T>(options: DeltaOptions<T>): MonoTypeOperatorFunction<T>;

export function delta<T = number>(
	options?: Partial<DeltaOptions<T>>
): MonoTypeOperatorFunction<T> {
	options ??= {};
	// Note: TypeScript cannot understand that we want this object and its
	// properties to be optional only if T == number. The overloads correctly
	// enforce that behavior for consumers, so we can be reasonably confident
	// that `options` will not be null unless T == number, but we need to use an
	// escape hatch to actually provide the defaults for that case.

	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	options.diff ??= (lhs, rhs) => lhs - rhs;

	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	options.zero ??= 0;

	const { diff, zero } = options;

	return pipe(
		scan((accum, current) => ({
			prev: accum.current,
			current,
		}), {
			prev: null as Opt<T>,
			current: null as Opt<T>,
		}),
		map(({ prev, current }) => {
			if (prev == null || current == null)
				return zero!;

			return diff!(current, prev);
		}),
	);
}
