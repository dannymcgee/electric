import {
	Component,
	ChangeDetectionStrategy,
	Input,
	HostBinding,
	Inject,
	OnInit,
	OnDestroy,
	ViewEncapsulation,
} from "@angular/core";
import { Subject } from "rxjs";

import { Coerce } from "@electric/ng-utils";
import { elementId } from "@electric/utils";

import {
	NodeAlignment,
	Graph,
	GRAPH,
	GraphNode,
	Port,
} from "../graph.types";

@Component({
	template: ``,
	encapsulation: ViewEncapsulation.None,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BaseNode
implements OnInit, OnDestroy, GraphNode {
	@HostBinding("class")
	protected readonly hostClass: string = "";

	@HostBinding("style.position")
	readonly _position = "absolute";

	@HostBinding("style.left.px")
	get _offsetX() { return this.x * this.graph.cellSize; }

	@HostBinding("style.top.px")
	get _offsetY() { return this.y * this.graph.cellSize; }

	@HostBinding("style.transform")
	get _transform() {
		return `
			translateX(${this._translateX})
			translateY(${this._translateY})`;
	}
	private get _translateX() {
		switch (this.xAlign) {
			case "left":   return "0";
			case "center": return "-50%";
			case "right":  return "-100%";
			default: return "0";
		}
	}
	private get _translateY() {
		switch (this.yAlign) {
			case "top":    return "0";
			case "center": return "-50%";
			case "bottom": return "-100%";
			default: return "0";
		}
	}

	@Input() id = elementId("graph-node");

	@Input() @Coerce(Number) x = 0;
	@Input() @Coerce(Number) y = 0;

	@Input() inputs: Port[] = [];
	@Input() outputs: Port[] = [];

	@Input("xAlign")
	get xAlignInput() { return this.xAlign; }
	set xAlignInput(value) {
		switch (value) {
			case "left":
			case "center":
			case "right":
				this.xAlign = value;
				break;
			default:
				throw new Error(
					`Value ${value} is not assignable to input \`xAlign\``
				);
		}
	}
	protected xAlign: NodeAlignment = "left";

	@Input()
	get yAlignInput() { return this.yAlign; }
	set yAlignInput(value) {
		switch (value) {
			case "top":
			case "center":
			case "bottom":
				this.yAlign = value;
				break;
			default:
				throw new Error(
					`Value ${value} is not assignable to input \`yAlign\``
				);
		}
	}
	protected yAlign: NodeAlignment = "top";

	changes$ = new Subject<void>();
	protected onDestroy$ = new Subject<void>();

	constructor (
		@Inject(GRAPH) protected graph: Graph,
	) {}

	ngOnInit(): void {
		this.graph.registerNode(this);
	}

	ngOnDestroy(): void {
		this.onDestroy$.next();
		this.onDestroy$.complete();

		this.graph.unregisterNode(this);
		this.changes$.complete();
	}
}
