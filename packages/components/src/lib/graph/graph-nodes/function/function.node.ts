import { DOCUMENT } from "@angular/common";
import {
	ChangeDetectionStrategy,
	Component,
	ElementRef,
	Inject,
	Input,
	ViewEncapsulation,
} from "@angular/core";
import { fromEvent, merge, takeUntil } from "rxjs";

import {
	GraphViewModel,
	GRAPH,
	Point,
	Graph,
	GRAPH_VIEW_MODEL,
} from "../../graph.types";
import { BaseNode } from "../base.node";

@Component({
	selector: "elx-function-node",
	template: `

<h4 class="elx-function-node__title"
	(pointerdown)="onPointerdown($event)"
>
	{{ name }}
</h4>

<!-- Input connection indicators -->
<div class="
	elx-function-node__connections
	elx-function-node__connections--input"
>
	<div class="elx-function-node__connection"></div>
	<div *ngFor="let input of inputs"
		class="elx-function-node__connection
		       elx-function-node__connection--{{ input.type }}"
		[class.connected]="input.connectedTo != null"
	></div>
	<div class="elx-function-node__connection"></div>
</div>

<!-- Output connection indicators -->
<div class="
	elx-function-node__connections
	elx-function-node__connections--output"
>
	<div class="elx-function-node__connection"></div>
	<div *ngFor="let output of outputs"
		class="elx-function-node__connection
		       elx-function-node__connection--{{ output.type }}"
		[class.connected]="output.connectedTo != null"
	></div>
	<div class="elx-function-node__connection"></div>
</div>

<!-- Body -->
<div class="elx-function-node__body">
	<!-- Inputs -->
	<div class="
		elx-function-node__ports
		elx-function-node__ports--input"
	>
		<div *ngFor="let input of inputs"
			class="elx-function-node__port
			       elx-function-node__port--input"
			[class.connected]="input.connectedTo != null"
		>
			{{ input.name ?? "" }}
		</div>
	</div>
	<!-- Outputs -->
	<div class="
		elx-function-node__ports
		elx-function-node__ports--output"
	>
		<div *ngFor="let output of outputs"
			class="elx-function-node__port
			       elx-function-node__port--output"
			[class.connected]="output.connectedTo != null"
		>
			{{ output.name ?? "" }}
		</div>
	</div>
</div>

	`,
	styleUrls: ["./function.node.scss"],
	encapsulation: ViewEncapsulation.None,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FunctionNode extends BaseNode {
	protected readonly hostClass = "elx-function-node";

	@Input() name = "Function";

	protected get element() { return this.elementRef.nativeElement; }

	constructor (
		@Inject(GRAPH) graph: Graph,
		@Inject(GRAPH_VIEW_MODEL) vm: GraphViewModel,
		@Inject(DOCUMENT) protected document: Document,
		protected elementRef: ElementRef<HTMLElement>,
	) {
		super(graph, vm);
	}

	inputOffset(idx: number): Point {
		return {
			x: 0,
			y: 4 + idx * 2,
		};
	}

	outputOffset(idx: number): Point {
		return {
			x: this.element.clientWidth / this.vm.cellSize,
			y: 4 + idx * 2,
		};
	}

	onPointerdown(event: PointerEvent): void {
		if (event.button !== 0) return;

		event.preventDefault();

		this.document.documentElement.style
			.setProperty("cursor", "grabbing");

		let xCurrent = this._offsetX;
		let yCurrent = this._offsetY;

		fromEvent<PointerEvent>(this.document, "pointermove").pipe(
			takeUntil(merge(
				fromEvent(this.document, "pointerup"),
				this.onDestroy$,
			)),
		).subscribe({
			next: ({ movementX, movementY }) => {
				let { scale, cellSize } = this.vm;

				xCurrent += movementX / window.devicePixelRatio / scale;
				yCurrent += movementY / window.devicePixelRatio / scale;
				let x = Math.round(xCurrent / cellSize);
				let y = Math.round(yCurrent / cellSize);

				if (x !== this.x || y !== this.y) {
					this.x = x;
					this.y = y;
					this.changes$.next();
				}
			},
			complete: () => {
				this.document.documentElement.style
					.removeProperty("cursor");
			},
		});
	}
}
