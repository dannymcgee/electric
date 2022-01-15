import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";

import { GraphComponent } from "./graph.component";
import {
	BaseNode,
	FunctionNode,
	RerouteNode
} from "./graph-nodes";

@NgModule({
	imports: [
		CommonModule,
	],
	declarations: [
		GraphComponent,
		BaseNode,
		FunctionNode,
		RerouteNode,
	],
	exports: [
		GraphComponent,
		BaseNode,
		FunctionNode,
		RerouteNode,
	]
})
export class GraphModule {}
