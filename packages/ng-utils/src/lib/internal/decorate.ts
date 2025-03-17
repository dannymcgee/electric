import { OnDestroy, OnInit } from "@angular/core";
import { Fn } from "@electric/utils";

export interface MethodDecorator<
	T extends any,
	Signature extends Fn<any[], any>
> {
	(
		proto: T,
		methodName: keyof T,
		descriptor: TypedPropertyDescriptor<T[typeof methodName] & Signature>,
	): (typeof descriptor) | undefined;
}

export type NgClass =
	& Record<PropertyKey, any>
	& Partial<OnInit & OnDestroy>;

export const NG_LIFECYCLE = /^ng(OnChanges|OnInit|AfterContentInit|AfterViewInit|OnDestroy)$/;
const SIDE_EFFECTS_MAP = new WeakMap<Object, Map<PropertyKey, Fn<any[]>[]>>();
const NOOP = () => {};

export function decorateMethod<
	T extends Object,
	K extends keyof T,
	F extends Fn,
>(
	proto: T,
	propName: K,
	sideEffect: F,
	descriptor?: TypedPropertyDescriptor<T[K]>
): typeof descriptor {
	let sideEffects = getSideEffects(proto, propName);
	sideEffects.push(sideEffect);

	descriptor ??= Object.getOwnPropertyDescriptor(proto, propName);
	if (descriptor?.configurable) {
		modifyMethodDescriptor(proto, propName, descriptor);
	} else if (!descriptor) {
		createMethodDescriptor(proto, propName);
	}

	return descriptor;
}

function getSideEffects(proto: Object, propName: PropertyKey) {
	if (!SIDE_EFFECTS_MAP.has(proto)) {
		SIDE_EFFECTS_MAP.set(proto, new Map<string, Fn<any[]>[]>());
	}
	let sideEffects = SIDE_EFFECTS_MAP.get(proto)!;
	if (!sideEffects.has(propName)) {
		sideEffects.set(propName, []);
	}
	return sideEffects.get(propName)!;
}

function createMethodDescriptor<
	T extends Object,
	K extends keyof T,
>(proto: T, propName: K) {
	let originalMethod = (proto[propName] ?? NOOP) as Fn<any[]>;

	Object.defineProperty(proto, propName, {
		value(...args: any[]) {
			let sideEffects = getSideEffects(proto, propName);
			for (let sideEffect of sideEffects) {
				sideEffect.call(this);
			}
			return originalMethod.call(this, ...args);
		}
	});
}

function modifyMethodDescriptor<
	T extends Object,
	K extends keyof T,
>(proto: T, propName: K, descriptor: TypedPropertyDescriptor<T[K]>) {
	let originalMethod = descriptor.value as Fn<any[]> & T[K];

	let updated = function (this: T, ...args: any[]) {
		let sideEffects = getSideEffects(proto, propName);
		for (let sideEffect of sideEffects) {
			sideEffect.call(this);
		}
		return originalMethod.call(this, ...args);
	} as unknown as T[K];

	if (typeof propName === "string" && NG_LIFECYCLE.test(propName)) {
		Object.defineProperty(proto, propName, {
			value: updated,
		});
	} else {
		descriptor.value = updated;
	}
}
