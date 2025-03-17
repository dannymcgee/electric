import { MethodDecorator, NgClass, decorateMethod } from "./internal/decorate";

export interface LoopMethod {
	(deltaTime?: number): void | false;
}

/**
 * Invokes the decorated method every frame, with the time elapsed since the
 * last invocation (in seconds) as its first argument. On the first invocation,
 * the `deltaTime` argument will be zero or nearly zero.
 *
 * The loop can be stopped at any point by returning `false` from the decorated
 * method. Once stopped, it can be started again by manually invoking the
 * method.
 *
 * For Angular components, directives, and services, the loop will be
 * automatically cleaned up in `ngOnDestroy`. For components and directives, the
 * loop will be automatically started in `ngOnInit`.
 */
export function Loop<T extends NgClass>(): MethodDecorator<T, LoopMethod> {
	return (proto, methodName, descriptor) => {
		const $frameRequest = Symbol("frameRequest");
		const $lastTick = Symbol("lastTick");

		function tick(this: any) {
			this[$frameRequest] = requestAnimationFrame((time) => {
				if (!this) return;

				if (this[$lastTick] == null) {
					this[$lastTick] = time;
				}

				let deltaTime = (time - this[$lastTick]) / 1000;
				this[$lastTick] = time;

				if (this[methodName].call(this, deltaTime) === false) {
					cancelAnimationFrame(this[$frameRequest]);

					this[$frameRequest] = undefined;
					this[$lastTick] = undefined;
				}
			});
		};

		decorateMethod(proto, "ngOnInit", tick);

		decorateMethod(proto, "ngOnDestroy", function (this: any) {
			if (this[$frameRequest]) {
				cancelAnimationFrame(this[$frameRequest]);
			}
		});

		return decorateMethod(proto, methodName, tick, descriptor)!;
	}
}
