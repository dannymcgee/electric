import { Component } from "@angular/core";

import { PortType } from "@electric/components";

@Component({
	templateUrl: "./graph.example.html",
	styleUrls: [
		"../example.shared.scss",
		"./graph.example.scss",
	],
	standalone: false,
})
export class GraphExample {
	PortType = PortType;
}
