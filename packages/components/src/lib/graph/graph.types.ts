import { InjectionToken } from "@angular/core";
import { Observable } from "rxjs";

export type NodeAlignment =
	| "top"
	| "right"
	| "bottom"
	| "left"
	| "center";

export interface Graph {
	cellSize: number;
	readonly scale: number;
	minScale: number;
	maxScale: number;
	readonly offsetX: number;
	readonly offsetY: number;
	readonly cursorX: number;
	readonly cursorY: number;
	registerNode(node: GraphNode): void;
	unregisterNode(node: GraphNode): void;
}

export interface GraphNode {
	id: string;
	x: number;
	y: number;
	inputs: Port[];
	outputs: Port[];
	changes$: Observable<void>;
}

export interface Port {
	name?: string;
	type: PortType | string;
	connectedTo?: PortConnection;
}

export enum PortType {
	Main = "main",
}

export interface PortConnection {
	nodeId: string;
	portIndex: number;
}

export const GRAPH = new InjectionToken<Graph>("Graph");
export const GRAPH_NODE = new InjectionToken<GraphNode>("GraphNode");
