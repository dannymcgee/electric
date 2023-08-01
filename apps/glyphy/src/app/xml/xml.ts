import { Ctor, exists, match } from "@electric/utils";

const XML_LUT = new Map<string, Ctor<XmlElement, [Element]>>();

/**
 * Glyphy uses [`fonttools/ttx`](https://fonttools.readthedocs.io/en/latest/ttx.html)
 * to parse/compile Open-Type fonts to/from XML. XML is... not the serialization
 * method I would have chosen, but `ttx` seems to be the most robust and fully-
 * featured OpenType parser available at the time of writing.
 *
 * To make this format workable, we parse the XML output to an in-memory DOM
 * tree and wrap each node with a subclass of `XMLElement` that knows how to
 * deserialize its corresponding XML markup. This is done with the aid of a few
 * decorators:
 *
 * * {@linkcode Xml} decorates the class to register itself as the JS object
 *   representation of the corresponding XML tag.
 *
 * * {@linkcode attr} decorates a property to register the {@linkcode Serde}
 *   implementation for the corresponding attribute.
 *
 * * {@linkcode child} decorates a property to register a child element with
 *   the given tag name as the provider for the decorated property (typically
 *   via the child's "value" attribute, but this can be overridden).
 *
 * The idea is similar to the way browsers parse HTML markup to `HTMLElement`
 * classes. With this data structure in memory, we can read from and write to
 * our `XmlElement` class properties, which will update the corresponding XML
 * attributes. When we're ready to compile the font back to OpenType, we can
 * just re-stringify the updated XML document and pass it back to `ttx`.
 *
 * @example
 * Given the following XML markup:
 * ```xml
 * <Foo bar="42">
 *   <Baz value="Hello" />
 * </Foo>
 * ```
 * We could declare a class to represent the `Foo` table like so:
 * ```typescript
 * import { Xml, XmlElement, attr, child, int, str } from "src/app/font/types/xml";
 *
 * ‌@​Xml("Foo")
 * export class Foo extends XmlElement {
 *   ‌@attr(int)
 *   bar!: number;
 *
 *   ‌@child("Baz", str)
 *   baz!: string;
 * }
 * ```
 */
export class XmlElement {
	protected _dom: Element;
	protected _children: XmlElement[];
	get nodeName() { return this._dom.nodeName; }

	constructor (dom: Element) {
		this._dom = dom;
		this._children = Array
			.from(dom.children)
			.map(child => {
				if (XML_LUT.has(`${this.nodeName}:${child.nodeName}`))
					return new (XML_LUT.get(`${this.nodeName}:${child.nodeName}`)!)(child);

				if (XML_LUT.has(child.nodeName))
					return new (XML_LUT.get(child.nodeName)!)(child);

				console.warn(`Unhandled XML element: <${child.nodeName} />`)
				return null;
			})
			.filter(exists);
	}
}

export function Xml<T extends XmlElement>(nodeName: string) {
	return (Type: Ctor<T, [Element]>) => {
		XML_LUT.set(nodeName, Type);
	}
}

export function attr<V>({ read, write }: Serde<V>) {
	return <T extends XmlElement, K extends string & keyof T>(target: T, key: K) => {
		Object.defineProperty(target, key, {
			get(this: T): V {
				return read(this["_dom"].getAttribute(key)!);
			},
			set(this: T, value: V): void {
				this["_dom"].setAttribute(key, write(value));
			},
		});
	};
}

export function child<V>(serde: Serde<V>): PropertyDecorator;
export function child<V>(nodeName: string, serde: Serde<V>): PropertyDecorator;
export function child<V>(nodeName: string, serde: Serde<V>, childKey: string): PropertyDecorator;

export function child<V, T extends XmlElement, C extends XmlElement>(...args: unknown[]) {
	return match(args.length, {
		1: () => {
			const [serde] = args as [Serde<V>];
			return (target: T, key: string & keyof T) => child_impl({
				childNodeName: key,
				serde,
				target,
				key,
			});
		},
		2: () => {
			const [childNodeName, serde] = args as [string, Serde<V>];
			return (target: T, key: string & keyof T) => child_impl({
				childNodeName,
				serde,
				target,
				key,
			});
		},
		3: () => {
			const [childNodeName, serde, childKey] = args as [string, Serde<V>, string & keyof C];
			return (target: T, key: string & keyof T) => child_impl({
				childNodeName,
				childKey,
				serde,
				target,
				key,
			});
		}
	});
}

interface ChildDecoratorParams<V, T extends XmlElement> {
	childNodeName: string;
	childKey?: string;
	serde: Serde<V>;
	target: T;
	key: string & keyof T;
}

// TODO: Refactor to allow grabbing child tables
function child_impl<V, T extends XmlElement, C extends XmlElement>({
	childNodeName, childKey = "value", serde, target, key,
}: ChildDecoratorParams<V, T>) {
	let lutKey!: string;
	if (childNodeName.includes(" as ")) {
		[childNodeName, lutKey] = childNodeName.split(" as ");
	} else {
		lutKey = childNodeName;
	}

	if (!XML_LUT.has(lutKey)) {
		const Child = class extends XmlElement {} as Ctor<C>;
		attr(serde)(Child.prototype, childKey)
		XML_LUT.set(lutKey, Child);
	}

	/**
	 * Naming things is hard. This is the key of the parent element that holds
	 * the child element, while `childKey` is the key of the child element that
	 * holds the value.
	 */
	const $childElementKey = Symbol(key);
	const isType = (it: XmlElement): it is C => it.nodeName === childNodeName;

	Object.defineProperty(target, key, {
		get(this: T): C[keyof C] | undefined {
			const child = ((this as any)[$childElementKey] ??= this["_children"].find(isType));
			return child?.[childKey as keyof C];
		},
		set(this: T, value: C[keyof C]) {
			const child = ((this as any)[$childElementKey] ??= this["_children"].find(isType));
			if (child) {
				child[childKey as keyof C] = value;
			}
		},
	});
}

export function textContent<V>({ read, write }: Serde<V>) {
	return <T extends XmlElement, K extends string & keyof T>(target: T, key: K) => {
		Object.defineProperty(target, key, {
			get(this: T): V {
				return read(this["_dom"].textContent!);
			},
			set(this: T, value: V): void {
				this["_dom"].textContent = write(value);
			},
		})
	}
}

export interface Serde<T> {
	read(value: string): T;
	write(value: T): string;
	new (): {};
}

export const float: Serde<number> = class {
	static read(value: string): number {
		if (!value) return undefined as any;
		const result = parseFloat(value);
		// console.log(`float.read ${value} -> ${result}`);
		return result;
	}
	static write(value: number): string {
		if (value == null) return "";
		return value.toString(10);
	}
}

export const int: Serde<number> = class {
	static read(value: string): number {
		if (!value) return undefined as any;
		const result = parseInt(value, 10);
		// console.log(`int.read ${value} -> ${result}`);
		return result;
	}
	static write(value: number): string {
		if (value == null) return "";
		return value.toString(10);
	}
}

export const hex: Serde<number> = class {
	static read(value: string): number {
		if (!value) return undefined as any;
		const result = parseInt(value, 16);
		// console.log(`hex.read ${value} -> ${result}`);
		return result;
	}
	static write(value: number): string {
		if (value == null) return "";
		return `0x${value.toString(16)}`;
	}
}

export function flags<T extends number>(): Serde<T> {
	return class {
		static read(value: string): T {
			if (!value) return undefined as any;
			const result = parseInt(value.replace(/ /g, ""), 2) as T;
			// console.log(`flags.read ${value} -> ${result}`);
			return result;
		}
		static write(value: T): string {
			if (value == null) return "";
			return value
				.toString(2)
				.replace(/([01]{4})/g, "$1 ")
				.trim();
		}
	}
}

export const str: Serde<string> = class {
	static read(value: string): string {
		// console.log(`str.read ${value} -> ${value}`);
		return value;
	}
	static write(value: string): string {
		return value;
	}
}

export const date: Serde<Date> = class {
	static read(value: string): Date {
		return new Date(value);
	}
	static write(value: Date): string {
		throw new Error("TODO");
	}
}

export const u32version: Serde<number> = class {
	// Note: This is faster than just processing the whole u32 using BigInts:
	// https://measurethat.net/Benchmarks/Show/19996/0/parse-32-bit-hex-bigint-vs-regex-parseint#latest_results_block
	static read(value: string): number {
		let [major, minor] = value
			.match(/0x([0-9a-f]{4})([0-9a-f]{4})/i)!
			.slice(1)
			.map(n => parseInt(n, 16));

		while (minor >= 1)
			minor /= 10;

		const result = Math.round((major + minor) * 1e5) / 1e5;
		// console.log(`u32Version.read ${value} -> ${result}`);
		return result;
	}

	static write(value: number): string {
		let minor = Math.round((value % 1) * 1e5);
		const major = Math.round(value - (minor / 1e5));

		while (minor && !(minor % 10))
			minor /= 10;

		const hexify = (n: number) => n
			.toString(16)
			.padStart(4, "0")
			.toUpperCase();

		return `0x${hexify(major)}${hexify(minor)}`;
	}
}
