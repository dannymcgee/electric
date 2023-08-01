import { NameID, PlatformID } from "../open-type";

export class Names {
	private _map = new Map<NameID, Name>();

	add(name: NameID, platform: PlatformID, value: string): void {
		if (!this._map.has(name))
			this._map.set(name, new Name())

		this._map.get(name)!.add(platform, value);
	}

	get(name: NameID, platform?: PlatformID): string | undefined {
		return this._map.get(name)?.get(platform);
	}
}

export class Name {
	private _map = new Map<PlatformID, string>();

	add(id: PlatformID, value: string): void {
		this._map.set(id, value);
	}

	get(id?: PlatformID): string | undefined {
		if (id) return this._map.get(id);
		return [...this._map.values()][0];
	}
}
