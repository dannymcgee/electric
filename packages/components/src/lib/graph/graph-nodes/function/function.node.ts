import { DOCUMENT } from "@angular/common";
import {
	ChangeDetectionStrategy,
	Component,
	inject,
	Input,
	ViewEncapsulation,
} from "@angular/core";
import { injectRef } from "@electric/ng-utils";
import { fromEvent, merge, takeUntil } from "rxjs";

import { Point } from "../../graph.types";
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
	@for (input of inputs; track input) {
		<elx-function-cx
			[type]="input.type"
			[connected]="input.connectedTo != null"
		/>
	}
	<div class="elx-function-node__connection"></div>
</div>

<!-- Output connection indicators -->
<div class="
	elx-function-node__connections
	elx-function-node__connections--output"
>
	<div class="elx-function-node__connection"></div>
	@for (output of outputs; track output) {
		<elx-function-cx
			[type]="output.type"
			[connected]="output.connectedTo != null"
		/>
	}
	<div class="elx-function-node__connection"></div>
</div>

<!-- Body -->
<div class="elx-function-node__body">
	<!-- Inputs -->
	<div class="
		elx-function-node__ports
		elx-function-node__ports--input"
	>
		@for (input of inputs; let idx = $index; track input) {
			<elx-function-port
				direction="input"
				[name]="input.name"
				[connected]="input.connectedTo != null"
				(draggedOut)="spawnConnector('input', input.type, idx)"
				(receivedDrop)="tryConnect('input', input.type, idx)"
			/>
		}
	</div>
	<!-- Outputs -->
	<div class="
		elx-function-node__ports
		elx-function-node__ports--output"
	>
		@for (output of outputs; let idx = $index; track output) {
			<elx-function-port
				direction="output"
				[name]="output.name"
				[connected]="output.connectedTo != null"
				(draggedOut)="spawnConnector('output', output.type, idx)"
				(receivedDrop)="tryConnect('output', output.type, idx)"
			/>
		}
	</div>
</div>

`,
	styleUrls: ["./function.node.scss"],
	encapsulation: ViewEncapsulation.None,
	changeDetection: ChangeDetectionStrategy.OnPush,
	standalone: false,
})
export class FunctionNode extends BaseNode {
	protected override readonly hostClass = "elx-function-node";

	@Input() name = "Function";

	protected get element() { return this.elementRef.nativeElement; }

	protected document = inject(DOCUMENT);
	protected elementRef = injectRef<HTMLElement>();

	override inputOffset(idx: number): Point {
		return {
			x: 0,
			y: 4 + idx * 2,
		};
	}

	override outputOffset(idx: number): Point {
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

	spawnConnector(
		direction: "input"|"output",
		type: string,
		portIndex: number,
	): void {
		console.log("spawnConnector:", { direction, type, portIndex });
		this.graph.spawnConnector(this.id, direction, type, portIndex);
	}

	tryConnect(
		direction: "input"|"output",
		type: string,
		portIndex: number,
	): void {
		this.connected.emit({
			receivingNodeId: this.id,
			direction,
			type,
			portIndex,
		});
	}
}
