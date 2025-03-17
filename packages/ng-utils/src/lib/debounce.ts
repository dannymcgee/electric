import { Fn } from "@electric/utils";
import { MethodDecorator, NG_LIFECYCLE } from "./internal/decorate";

type VoidFn = Fn<any[], void>;

export function Debounce(timeout: number): MethodDecorator<any, VoidFn> {
	return (proto, methodName, descriptor) => {
		let $timeout = Symbol("timeout");
		let method: VoidFn =
			descriptor?.configurable
				? descriptor.value
				: proto[methodName];

		let updated = function (this: any, ...args: any[]) {
			if (this[$timeout]) return;
			this[$timeout] = setTimeout(() => {
				method.call(this, ...args);
				this[$timeout] = undefined;
			}, timeout);
		}

		if (typeof methodName === "string" && NG_LIFECYCLE.test(methodName)) {
			Object.defineProperty(proto, methodName, { value: updated });
			return Object.getOwnPropertyDescriptor(proto, methodName);
		}

		descriptor.value = updated;
		return descriptor;
	}
}
