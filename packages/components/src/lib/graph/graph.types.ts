import { InjectionToken, Type } from "@angular/core";
import { Observable } from "rxjs";

export type NodeAlignment =
	| "top"
	| "right"
	| "bottom"
	| "left"
	| "center";

export interface GraphViewModel {
	cellSize: number;

	readonly scale: number;
	minScale: number;
	maxScale: number;

	readonly offset: Point;
	readonly cursor: Point;
}

export interface Graph {
	registerNode(node: GraphNode): void;
	unregisterNode(node: GraphNode): void;
}

export interface GraphNode {
	id: string;
	name?: string;
	x: number;
	y: number;
	inputs: Port[];
	outputs: Port[];
	changes$: Observable<void>;
	inputOffset(index: number): Point;
	outputOffset(index: number): Point;
}

export interface Point {
	x: number;
	y: number;
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

export interface GraphType {
	type: string;
	color: string;
}

export interface GraphNodeDescriptor<T extends GraphNode = any> {
	type: Type<T>;
	displayName: string;
	inputs: Port[];
	outputs: Port[];
}

export type GraphNodeDescriptorSet = Record<string, GraphNodeDescriptor>;

export const GRAPH = new InjectionToken<Graph>("Graph");
export const GRAPH_VIEW_MODEL
	= new InjectionToken<GraphViewModel>("GraphViewModel");

export const GRAPH_NODE = new InjectionToken<GraphNode>("GraphNode");
export const GRAPH_TYPES = new InjectionToken<GraphType[]>("GraphTypes");
export const GRAPH_NODE_DESCRIPTOR_SET
	= new InjectionToken<GraphNodeDescriptorSet>("GraphNodeDescriptorSet");

