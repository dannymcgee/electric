import { DOCUMENT } from "@angular/common";
import {
	AfterViewInit,
	ChangeDetectionStrategy,
	Component,
	ElementRef,
	HostBinding,
	HostListener,
	Inject,
	Input,
	OnDestroy,
	ViewEncapsulation,
} from "@angular/core";
import { path } from "d3-path";
import { fromEvent, merge, Subject, takeUntil } from "rxjs";

import { Coerce, DetectChanges } from "@electric/ng-utils";
import { anim } from "@electric/style";
import { assert } from "@electric/utils";

import { GRAPH, GraphNode, Point } from "./graph.types";

interface BezierParams {
	x1: number;
	y1: number;
	x2: number;
	y2: number;
	cpx1: number;
	cpy1: number;
	cpx2: number;
	cpy2: number;
}

@Component({
	selector: "elx-graph",
	template: `

<div class="elx-graph__nodes"
	[style.transform]="_nodesXform"
	[style.transform-origin]="_nodesXformOrigin"
>
	<svg class="elx-graph__wires">
		<path class="elx-graph__wire"
			*ngFor="let p of _paths"
			[attr.d]="p"
		></path>

		<ng-container *ngIf="_debugControlPoints">
			<path class="elx-graph__control-point"
				*ngFor="let p of _controlPoints"
				[attr.d]="p"
			></path>
		</ng-container>
	</svg>
	<ng-content></ng-content>
</div>

<div class="elx-graph__cursor-pos">
	{{
		(cursorX - offsetX) / scale / cellSize | number:'1.0-0'
	}}, {{
		(cursorY - offsetY) / scale / cellSize | number:'1.0-0'
	}}
</div>
<div class="elx-graph__scale">
	{{ scale | number:'1.2-2' }}
</div>

	`,
	styleUrls: ["./graph.component.scss"],
	providers: [{
		provide: GRAPH,
		useExisting: GraphComponent,
	}],
	encapsulation: ViewEncapsulation.None,
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class GraphComponent implements AfterViewInit, OnDestroy {
	@HostBinding("class")
	readonly _hostClass = "elx-graph";

	@HostBinding("style.background-size")
	get _backgroundSize() {
		let cellSize = this.cellSize * this._scale;
		while (cellSize < this.cellSize) cellSize *= 2;

		let lg = ((this.cellSize * 128 * this._scale) + "px ").repeat(2).trim();
		let sm = (cellSize + "px ").repeat(2).trim();

		return [lg, sm, lg, sm].join(", ");
	}

	@HostBinding("style.background-position")
	get _backgroundPosition() {
		let x = this._offsetX + "px";
		let y = this._offsetY + "px";

		return `${x} 0, ${x} 0, 0 ${y}, 0 ${y}`;
	}

	get _nodesXform() {
		return `
			scale(${this._scale})
			translateX(${Math.round(this._offsetX)}px)
			translateY(${Math.round(this._offsetY)}px)`
	}

	get _nodesXformOrigin() {
		return `${this._offsetX}px ${this._offsetY}px`;
	}

	@Input() @Coerce(Number) cellSize = 16;

	@Input() @Coerce(Number) minScale = 0.1;
	@Input() @Coerce(Number) maxScale = 1.0;

	get scale() { return this._scale; }
	@DetectChanges() private _scale = 1.0;

	get offsetX() { return this._offsetX; }
	@DetectChanges() private _offsetX = 0;
	get offsetY() { return this._offsetY; }
	@DetectChanges() private _offsetY = 0;

	get cursorX() { return this._cursorX; }
	@DetectChanges() private _cursorX = 0.0;
	get cursorY() { return this._cursorY; }
	@DetectChanges() private _cursorY = 0.0;

	private _nodes = new Map<string, GraphNode>();
	@DetectChanges() _paths: string[] = [];

	@DetectChanges() _controlPoints: string[] = [];
	_debugControlPoints = false;

	private _onDestroy$ = new Subject<void>();

	private get _element() { return this._elementRef.nativeElement; }

	constructor (
		@Inject(DOCUMENT) private _document: Document,
		private _elementRef: ElementRef<HTMLElement>,
	) {}

	ngAfterViewInit(): void {
		this.drawConnections();
	}

	ngOnDestroy(): void {
		this._onDestroy$.next();
		this._onDestroy$.complete();
	}

	registerNode(node: GraphNode): void {
		assert(
			!this._nodes.has(node.id),
			`Graph node with id "${node.id}" was registered more than once!`,
		);
		this._nodes.set(node.id, node);

		node.changes$
			.pipe(takeUntil(this._onDestroy$))
			.subscribe(() => {
				this.drawConnections();
			});
	}

	unregisterNode(node: GraphNode): void {
		this._nodes.delete(node.id);
	}

	@HostListener("wheel", ["$event"])
	onZoom({ deltaX, deltaY, deltaZ }: WheelEvent): void {
		// Get the raw delta of the wheel event (+/- 1);
		let rawDelta = Math.sign(deltaX + deltaY + deltaZ);
		// Scale by the current zoom level so the zooming feels roughly linear
		let delta = rawDelta * this._scale * -0.1;

		// Calculate the new scale
		let scale = this._scale + delta;
		let roundingFactor = scale >= 1 ? 10 : 100;
		scale = Math.round(scale * roundingFactor) / roundingFactor;
		scale = anim.clamp(scale, [this.minScale, this.maxScale]);
		if (Math.abs(scale - 1) < 0.05)
			scale = 1;

		// Bail if the difference ~= 0.0
		let deltaScale = this._scale - scale;
		if (Math.abs(deltaScale) < Number.EPSILON)
			return;

		// Center the transform on the cursor position
		this._offsetX += ((this.cursorX - this._offsetX) / this._scale) * deltaScale;
		this._offsetY += ((this.cursorY - this._offsetY) / this._scale) * deltaScale;

		this._scale = scale;
	}

	@HostListener("pointerdown", ["$event"])
	onMousedown(event: PointerEvent): void {
		if (event.button !== 1) return;

		event.preventDefault();
		this._document.documentElement.style
			.setProperty("cursor", "grabbing");

		fromEvent<PointerEvent>(this._document, "pointermove").pipe(
			takeUntil(merge(
				fromEvent(this._document, "pointerup"),
				this._onDestroy$,
			)),
		).subscribe({
			next: event => {
				this._offsetX += event.movementX / window.devicePixelRatio;
				this._offsetY += event.movementY / window.devicePixelRatio;
			},
			complete: () => {
				this._document.documentElement.style
					.removeProperty("cursor");
			},
		});
	}

	@HostListener("pointermove", ["$event"])
	onMousemove(event: PointerEvent): void {
		this._cursorX = event.clientX - this._element.offsetLeft;
		this._cursorY = event.clientY - this._element.offsetTop;
	}

	private drawConnections(): void {
		let paths = [] as string[];
		let cPoints = [] as string[];

		for (let node of this._nodes.values()) {
			node.outputs.forEach((out, idx) => {
				if (!out.connectedTo) return;

				let inputNode = this._nodes.get(out.connectedTo.nodeId);
				if (!inputNode) return;

				let p1Offset = node.outputOffset(idx);
				let p2Offset = inputNode.inputOffset(out.connectedTo.portIndex);

				let p1 = {
					x: node.x + p1Offset.x,
					y: node.y + p1Offset.y,
				};
				let p2 = {
					x: inputNode.x + p2Offset.x,
					y: inputNode.y + p2Offset.y,
				};

				let {
					x1, y1,
					x2, y2,
					cpx1, cpy1,
					cpx2, cpy2,
				} = this.drawConnection(p1, p2);

				let p = path();
				p.moveTo(x1, y1);
				p.bezierCurveTo(cpx1, cpy1, cpx2, cpy2, x2, y2);

				paths.push(p.toString());

				if (this._debugControlPoints) {
					let cp1 = path();
					cp1.moveTo(x1, y1);
					cp1.lineTo(cpx1, cpy1);

					let cp2 = path();
					cp2.moveTo(x2, y2);
					cp2.lineTo(cpx2, cpy2);

					cPoints.push(cp1.toString(), cp2.toString());
				}
			});
		}

		this._paths = paths;

		if (this._debugControlPoints)
			this._controlPoints = cPoints;
	}

	private drawConnection(p1: Point, p2: Point): BezierParams {
		let x1 = p1.x * this.cellSize;
		let y1 = p1.y * this.cellSize;

		let x2 = p2.x * this.cellSize;
		let y2 = p2.y * this.cellSize;

		let dist = Math.sqrt(Math.pow(x1-x2, 2) + Math.pow(y1-y2, 2));
		let cpLen = dist / 3;

		let dx = p2.x - p1.x;
		if (dx <= 6) {
			cpLen *= anim.clamp(anim.remap(dx, [6, 0], [1, 2]), [1, 2]);
			cpLen = anim.clamp(cpLen, [-20 * this.cellSize, 20 * this.cellSize]);
		}

		let cpx1 = x1 + cpLen;
		let cpx2 = x2 - cpLen;
		let cpy1 = y1;
		let cpy2 = y2;

		return { x1,y1, x2,y2, cpx1,cpy1, cpx2,cpy2 };
	}
}
