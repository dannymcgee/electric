import { inject, Injectable } from "@angular/core";
import {
	GRAPH_NODE_DESCRIPTOR_SET,
	GRAPH_TYPES,
	GraphNodeDescriptor,
} from "./graph.types";

@Injectable()
export class GraphLibrary {
	private _types = new Map<string, string>();

	get nodes() {
		return this._nodes as ReadonlyMap<string, GraphNodeDescriptor>;
	}
	private _nodes = new Map<string, GraphNodeDescriptor>();

	constructor () {
		const types = inject(GRAPH_TYPES);
		const nodes = inject(GRAPH_NODE_DESCRIPTOR_SET);

		for (let type of types)
			this._types.set(type.type, type.color);

		for (let [id, desc] of Object.entries(nodes))
			this._nodes.set(id, desc);
	}

	typeColor(type: string): string {
		if (!this._types.has(type))
			throw new Error(`Graph type "${type}" not registered!`);

		return this._types.get(type)!;
	}

	descriptor(id: string): GraphNodeDescriptor {
		if (!this._nodes.has(id))
			throw new Error(`GraphNodeDescriptor with id "${id}" not registered!`);

		return this._nodes.get(id)!;
	}
}
