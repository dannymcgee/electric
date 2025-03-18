import { DOCUMENT } from "@angular/common";
import { ChangeDetectorRef, inject, Injectable, OnDestroy } from "@angular/core";
import { path } from "d3-path";
import { fromEvent, merge, Subject, takeUntil } from "rxjs";

import { anim } from "@electric/style";

import { GraphNode, GraphViewModel, Point } from "./graph.types";

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

@Injectable()
export class GraphViewModelService implements GraphViewModel, OnDestroy {
	cellSize = 16;

	scale = 1.0;
	minScale = 0.1;
	maxScale = 1.0;

	offset: Point = { x: 0, y: 0 }
	cursor: Point = { x: 0, y: 0 }

	get gridCursor(): Point {
		return {
			x: (this.cursor.x - this.offset.x) / this.scale / this.cellSize,
			y: (this.cursor.y - this.offset.y) / this.scale / this.cellSize,
		}
	}

	get backgroundSize() {
		let cellSize = this.cellSize * this.scale;
		while (cellSize < this.cellSize) cellSize *= 2;

		let lg = ((this.cellSize * 128 * this.scale) + "px ").repeat(2).trim();
		let sm = (cellSize + "px ").repeat(2).trim();

		return [lg, sm, lg, sm].join(", ");
	}

	get backgroundPosition() {
		let x = this.offset.x + "px";
		let y = this.offset.y + "px";

		return `${x} 0, ${x} 0, 0 ${y}, 0 ${y}`;
	}

	get nodesTransform() {
		return `
			scale(${this.scale})
			translateX(${Math.round(this.offset.x)}px)
			translateY(${Math.round(this.offset.y)}px)`
	}

	get nodesTransformOrigin() {
		return `${this.offset.x}px ${this.offset.y}px`;
	}

	get paths() { return this._paths; }
	private _paths: string[] = [];

	debugControlPoints = false;
	get controlPoints() { return this._controlPoints; }
	private _controlPoints: string[] = [];

	private _onDestroy$ = new Subject<void>();
	private _document = inject(DOCUMENT);
	private _changeDetector = inject(ChangeDetectorRef);

	ngOnDestroy(): void {
		this._onDestroy$.next();
		this._onDestroy$.complete();
	}

	onZoom({ deltaX, deltaY, deltaZ }: WheelEvent): void {
		// Get the raw delta of the wheel event (+/- 1);
		let rawDelta = Math.sign(deltaX + deltaY + deltaZ);
		// Scale by the current zoom level so the zooming feels roughly linear
		let delta = rawDelta * this.scale * -0.1;

		// Calculate the new scale
		let scale = this.scale + delta;
		let roundingFactor = scale >= 1 ? 10 : 100;
		scale = Math.round(scale * roundingFactor) / roundingFactor;
		scale = anim.clamp(scale, [this.minScale, this.maxScale]);
		if (Math.abs(scale - 1) < 0.05)
			scale = 1;

		// Bail if the difference ~= 0.0
		let deltaScale = this.scale - scale;
		if (Math.abs(deltaScale) < Number.EPSILON)
			return;

		// Center the transform on the cursor position
		this.offset.x += ((this.cursor.x - this.offset.x) / this.scale) * deltaScale;
		this.offset.y += ((this.cursor.y - this.offset.y) / this.scale) * deltaScale;

		this.scale = scale;
	}

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
				this.offset.x += event.movementX / window.devicePixelRatio;
				this.offset.y += event.movementY / window.devicePixelRatio;
			},
			complete: () => {
				this._document.documentElement.style
					.removeProperty("cursor");
			},
		});
	}

	drawConnections(nodes: Map<string, GraphNode>): void {
		let paths = [] as string[];
		let cPoints = [] as string[];

		for (let node of nodes.values()) {
			node.outputs.forEach((out, idx) => {
				if (!out.connectedTo) return;

				let inputNode = nodes.get(out.connectedTo.nodeId);
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

				if (this.debugControlPoints) {
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

		if (this.debugControlPoints)
			this._controlPoints = cPoints;

		this._changeDetector.markForCheck();
	}

	drawConnection(p1: Point, p2: Point): BezierParams {
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
