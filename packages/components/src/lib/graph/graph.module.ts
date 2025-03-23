import { ErrorHandler, ModuleWithProviders, NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";

import { MenuModule } from "@electric/components/menu";

import { GraphComponent } from "./graph.component";
import { GraphLibrary } from "./graph-library.service";
import {
	BaseNode,
	FunctionNode,
	RerouteNode
} from "./graph-nodes";
import { ConnectorNode } from "./graph-nodes/connector/connector.node";
import { FunctionPortComponent } from "./graph-nodes/function/port.component";
import { FunctionConnectionComponent } from "./graph-nodes/function/connection.component";
import {
	GraphNodeDescriptorSet,
	GraphType,
	GRAPH_NODE_DESCRIPTOR_SET,
	GRAPH_TYPES,
} from "./graph.types";
import { SpuriousErrorCatcher } from "./spurious-error-catcher.service";

interface ModuleParams {
	types: GraphType[];
	nodes: GraphNodeDescriptorSet;
}

@NgModule({
	imports: [
		CommonModule,
		MenuModule,
	],
	declarations: [
		GraphComponent,
		BaseNode,
		ConnectorNode,
		FunctionNode,
		FunctionPortComponent,
		FunctionConnectionComponent,
		RerouteNode,
	],
	exports: [
		GraphComponent,
		BaseNode,
		FunctionNode,
		RerouteNode,
	]
})
export class GraphModule {
	static withLibrary({
		types,
		nodes,
	}: ModuleParams): ModuleWithProviders<GraphModule> {
		return {
			ngModule: GraphModule,
			providers: [
				{
					provide: GRAPH_TYPES,
					useValue: types,
				},
				{
					provide: GRAPH_NODE_DESCRIPTOR_SET,
					useValue: nodes,
				},
				{
					provide: ErrorHandler,
					useClass: SpuriousErrorCatcher,
				},
				GraphLibrary,
			],
		};
	}
}
