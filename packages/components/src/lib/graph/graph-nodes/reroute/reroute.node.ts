import { DOCUMENT } from "@angular/common";
import {
	ChangeDetectionStrategy,
	Component,
	HostListener,
	Inject,
	Input,
	ViewEncapsulation,
} from "@angular/core";
import { animationFrames, fromEvent, merge, takeUntil } from "rxjs";

import { GRAPH, Graph, NodeAlignment, Port, PortType } from "../../graph.types";
import { BaseNode } from "../base.node";

@Component({
	selector: "elx-reroute-node",
	template: `

<div class="elx-reroute-node__shape"></div>

	`,
	styleUrls: ["./reroute.node.scss"],
	encapsulation: ViewEncapsulation.None,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RerouteNode extends BaseNode {
	protected readonly hostClass = "elx-reroute-node";

	protected xAlign: NodeAlignment = "center";
	protected yAlign: NodeAlignment = "center";

	@Input() inputs: Port[] = [{ type: PortType.Main }];
	@Input() outputs: Port[] = [{ type: PortType.Main }];

	constructor (
		@Inject(GRAPH) graph: Graph,
		@Inject(DOCUMENT) private _document: Document,
	) {
		super(graph);
	}

	@HostListener("pointerdown", ["$event"])
	onPointerdown(event: PointerEvent): void {
		if (event.button !== 0) return;

		event.preventDefault();

		animationFrames().pipe(
			takeUntil(merge(
				fromEvent(this._document, "pointerup"),
				this.onDestroy$,
			)),
		).subscribe(_ => {
			let {
				cursorX, cursorY,
				offsetX, offsetY,
				scale,
				cellSize,
			} = this.graph;

			let x = Math.round((cursorX - offsetX) / scale / cellSize);
			let y = Math.round((cursorY - offsetY) / scale / cellSize);

			if (x !== this.x || y !== this.y) {
				this.x = x;
				this.y = y;
				this.changes$.next();
			}
		});
	}
}
