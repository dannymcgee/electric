import { Serde } from "./serde"

export type CustomElementCtor<T extends HTMLElement = HTMLElement>
	= (new () => T)
	& { prototype: T }

// FIXME: Hey! This isn't comptime! >:[ It's also suuuuper opaque.
// Refactor this logic to inline it into the class definition.
// Something like this should work:
//
// import { STRING as __$STRING } from "@electric/framework/src/lib/internal/serde"
//
// export class MyElement extends HTMLElement {
//   static observedAttributes = ["foo", "bar"]
//
//   // @input foo = "bar"
//   get foo() { return this.#__$foo_accessor.get() }
//   set #__$foo(value) { this.#__$foo_accessor.set(value) }
//   #__$foo_accessor = new InputAccessor({ serde: __$STRING, init: "bar" })
//
//   // @input bar = "baz"
//   get bar() { return this.#__$bar_accessor.get() }
//   set #__$bar(value) { this.#__$bar_accessor.set(value) }
//   #__$bar_accessor = new InputAccessor({ serde: __$STRING, init: "baz" })
//
//   attributeChangedCallback(prev, current, attrName) {
//     if (prev === current) return
//     switch (attrName) {
//       case "foo":
//         this.#__$foo = current
//         break
//       case "bar":
//         this.#__$bar = current
//         break
//     }
//   }
// }
//
export function setupInputs<T extends HTMLElement = HTMLElement>(
	Type: CustomElementCtor<T>,
	observedAttributes: Record<string, InputConfig<any>>,
) {
	const setterKeys = new Map<string, symbol>()
	const accessors = new Map<string, InputAccessor<any>>()

	for (let [propName, config] of Object.entries(observedAttributes)) {
		const attrName = propName.replace(/[A-Z]/g, c => `-${c.toLowerCase()}`)
		const setterKey = Symbol(attrName)
		const getterKey = propName
		const accessor = new InputAccessor(config)

		setterKeys.set(attrName, setterKey)
		accessors.set(attrName, new InputAccessor(config))

		Object.defineProperties(Type.prototype, {
			[getterKey]: {
				get: () => accessor.get()
			},
			[setterKey]: {
				set: str => accessor.set(str)
			}
		})
	}

	Object.defineProperty(Type.prototype, "attributeChangedCallback", {
		value(this: any, prev: string, current: string, attrName: string) {
			if (prev === current) return
			const key = setterKeys.get(attrName)!
			this[key] = current
		}
	})
}

export interface InputConfig<T> {
	serde: Serde<T>
	init?: T
}

export class InputAccessor<T> {
	#value?: T
	#serde: Serde<T>

	constructor ({ serde, init }: InputConfig<T>) {
		this.#value = init
		this.#serde = serde
	}

	get(): T | null {
		return this.#value ?? null
	}

	set(value: string) {
		this.#value = this.#serde.read(value)
	}
}
