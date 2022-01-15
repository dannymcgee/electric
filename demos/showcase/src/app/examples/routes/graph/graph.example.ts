import { Component } from "@angular/core";

import { PortType } from "@electric/components";

@Component({
	templateUrl: "./graph.example.html",
	styleUrls: [
		"../example.shared.scss",
		"./graph.example.scss",
	],
})
export class GraphExample {
	PortType = PortType;
}
