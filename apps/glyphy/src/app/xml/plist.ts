import { Ctor, match } from "@electric/utils";
import * as fs from "@tauri-apps/api/fs";
import * as path from "@tauri-apps/api/path";

import { float, int, Serde, str } from "./xml";

const PARSER = new DOMParser();

export class PList {
	protected static serializer = new XMLSerializer();

	protected doc: XMLDocument;
	protected fsPath: string;
	declare protected lut: Map<string, Element>;

	constructor (doc: XMLDocument, fsPath: string) {
		this.doc = doc;
		this.fsPath = fsPath;
	}

	/** Saves the current state back to disk */
	async save() {
		const xml = PList.serializer
			.serializeToString(this.doc)
			.replace(/<!DOCTYPE/, "\n<!DOCTYPE")
			.replace(/<plist/, "\n<plist")
			.replace(/<key/g, "\n\t<key")
			.replace(/<\/key></g, "</key>\n\t<")
			.replace(/<\/dict/, "\n</dict>");

		await fs.writeTextFile(this.fsPath, xml);
	}
}

type PListCtor<T extends PList> = Ctor<T, [Document, string]>

export function plist<T extends PList>(Type: PListCtor<T>) {
	return (class PListDocument extends (Type as any) {
		protected lut = new Map<string, Element>();

		constructor (doc: XMLDocument, fsPath: string) {
			super(doc, fsPath);

			const dict = doc.querySelector("dict");
			if (!dict) throw new Error("Failed to find <dict> in PList document!");

			let key = "";
			for (let i = 0; i < dict.children.length; ++i) {
				const child = dict.children.item(i)!;
				if (child.nodeName === "key")
					key = child.textContent!;
				else {
					this.lut.set(key, child);
				}
			}
		}
	}) as any;
}

export function prop<V>(serde: Serde<V>) {
	return (target: PList, key: string) => {
		Object.defineProperty(target, key, {
			get(this: PList): V | undefined {
				const element = this.lut.get(key);
				if (element?.textContent == null)
					return undefined;

				return serde.read(element.textContent);
			},
			set(this: PList, value: V): void {
				let element = this.lut.get(key);
				if (!element) {
					const dict = this.doc.querySelector("dict");
					if (!dict) throw new Error("Failed to find <dict> in PList document!");

					const keyElement = this.doc.createElement("key");
					keyElement.textContent = key;

					const valueNodeName = match(serde.name, {
						[float.name]: () => {
							if ((value as unknown as number) % 1 === 0)
								return "integer";
							return "float";
						},
						[int.name]: () => "integer",
						[str.name]: () => "string",
						_: () => {
							throw new Error(`Unable to serialize property "${key}" to PList`);
						}
					});

					element = this.doc.createElement(valueNodeName);

					dict.appendChild(keyElement);
					dict.appendChild(element);

					this.lut.set(key, element);
				}

				element.textContent = serde.write(value);
			},
		});
	}
}

export async function readPList<T extends PList>(Type: PListCtor<T>, path: string): Promise<T> {
	const xml = await fs.readTextFile(path);
	const doc = PARSER.parseFromString(xml, "text/xml");

	return new Type(doc, path);
}

export async function newPList<T extends PList>(
	Type: PListCtor<T>,
	filename: string,
	dir?: string,
): Promise<T> {
	const xml = `
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple Computer//DTD PLIST 1.0//EN"
"http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict></dict>
</plist>
	`.trim();

	const doc = PARSER.parseFromString(xml, "text/xml");

	if (dir) filename = await path.join(dir, filename);

	const result = new Type(doc, filename);

	await fs.writeTextFile(filename, xml);

	return result;
}
