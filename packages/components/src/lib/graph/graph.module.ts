import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";

import { GraphComponent } from "./graph.component";
import { BaseNode } from './graph-nodes/base.node';
import { RerouteNode } from "./graph-nodes/reroute/reroute.node";

@NgModule({
	imports: [
		CommonModule,
	],
	declarations: [
		GraphComponent,
		BaseNode,
		RerouteNode,
	],
	exports: [
		GraphComponent,
		BaseNode,
		RerouteNode,
	]
})
export class GraphModule {}
