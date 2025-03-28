import { DOCUMENT } from "@angular/common";
import {
	ChangeDetectionStrategy,
	Component,
	HostListener,
	inject,
	Input,
	ViewEncapsulation,
} from "@angular/core";
import { animationFrames, fromEvent, merge, takeUntil } from "rxjs";

import { NodeAlignment, Port, PortType } from "../../graph.types";
import { GraphLibrary } from "../../graph-library.service";
import { BaseNode } from "../base.node";

@Component({
	selector: "elx-reroute-node",
	template: `

<div class="elx-reroute-node__shape"
	[style.background-color]="color"
></div>

	`,
	styleUrls: ["./reroute.node.scss"],
	encapsulation: ViewEncapsulation.None,
	changeDetection: ChangeDetectionStrategy.OnPush,
	standalone: false,
})
export class RerouteNode extends BaseNode {
	protected override readonly hostClass = "elx-reroute-node";

	protected override xAlign: NodeAlignment = "center";
	protected override yAlign: NodeAlignment = "center";

	@Input() type!: string;

	@Input() override inputs: Port[] = [{ type: PortType.Main }];
	@Input() override outputs: Port[] = [{ type: PortType.Main }];

	get color() { return this._color ??= this._library.typeColor(this.type); }
	private _color?: string;

	private _document = inject<Document>(DOCUMENT);
	private _library = inject(GraphLibrary);

	@HostListener("pointerdown", ["$event"])
	onPointerdown(event: PointerEvent): void {
		if (event.button !== 0) return;

		event.preventDefault();

		this._document.documentElement.style
			.setProperty("cursor", "grabbing");

		animationFrames().pipe(
			takeUntil(merge(
				fromEvent(this._document, "pointerup"),
				this.onDestroy$,
			)),
		).subscribe({
			next: _ => {
				let { cursor, offset, scale, cellSize } = this.vm;

				let x = Math.round((cursor.x - offset.x) / scale / cellSize);
				let y = Math.round((cursor.y - offset.y) / scale / cellSize);

				if (x !== this.x || y !== this.y) {
					this.x = x;
					this.y = y;
					this.changes$.next();
				}
			},
			complete: () => {
				this._document.documentElement.style
					.removeProperty("cursor");
			},
		});
	}
}
