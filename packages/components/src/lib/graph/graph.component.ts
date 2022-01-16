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
	OnInit,
	Self,
	ViewChild,
	ViewContainerRef,
	ViewEncapsulation,
} from "@angular/core";
import { Subject, takeUntil } from "rxjs";

import { Coerce } from "@electric/ng-utils";
import { assert, entries } from "@electric/utils";

import { Graph, GRAPH, GRAPH_VIEW_MODEL, GraphNode } from "./graph.types";
import { GraphViewModelService } from "./graph-view-model.service";
import { GraphLibrary } from "./graph-library.service";

interface GraphNodeMenuItem {
	id: string;
	displayName: string;
}

@Component({
	selector: "elx-graph",
	template: `

<div class="elx-graph__menu-trigger"
	[elxContextMenuTriggerFor]="contextMenu"
></div>
<div class="elx-graph__nodes"
	[style.transform]="vm.nodesTransform"
	[style.transform-origin]="vm.nodesTransformOrigin"
>
	<svg class="elx-graph__wires">
		<path class="elx-graph__wire"
			*ngFor="let p of vm.paths"
			[attr.d]="p"
		></path>

		<ng-container *ngIf="vm.debugControlPoints">
			<path class="elx-graph__control-point"
				*ngFor="let p of vm.controlPoints"
				[attr.d]="p"
			></path>
		</ng-container>
	</svg>
	<ng-content></ng-content>
	<ng-container #nodeOutlet></ng-container>
</div>

<div class="elx-graph__cursor-pos">
	{{ vm.gridCursor.x | number:'1.0-0' }}, {{ vm.gridCursor.y | number:'1.0-0' }}
</div>
<div class="elx-graph__scale">
	{{ vm.scale | number:'1.2-2' }}
</div>

<elx-menu #contextMenu>
	<elx-menuitem *ngFor="let node of libNodes"
		(click)="spawnNode(node.id)"
	>
		{{ node.displayName }}
	</elx-menuitem>
</elx-menu>

	`,
	styleUrls: ["./graph.component.scss"],
	providers: [
		{
			provide: GRAPH,
			useExisting: GraphComponent,
		},
		{
			provide: GRAPH_VIEW_MODEL,
			useClass: GraphViewModelService,
		},
	],
	encapsulation: ViewEncapsulation.None,
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class GraphComponent
implements Graph, OnInit, AfterViewInit, OnDestroy {
	@HostBinding("class")
	readonly _hostClass = "elx-graph";

	@HostBinding("style.background-size")
	get _backgroundSize() { return this.vm.backgroundSize; }

	@HostBinding("style.background-position")
	get _backgroundPosition() { return this.vm.backgroundPosition; }

	@Input()
	@Coerce(Number)
	get cellSize() { return this.vm.cellSize; }
	set cellSize(value) { this.vm.cellSize = value; }

	@Input()
	@Coerce(Number)
	get minScale() { return this.vm.minScale; }
	set minScale(value) { this.vm.minScale = value; }

	@Input()
	@Coerce(Number)
	get maxScale() { return this.vm.maxScale; }
	set maxScale(value) { this.vm.maxScale = value; }

	get libNodes() { return this._libNodes; }
	private _libNodes: GraphNodeMenuItem[] = [];

	@ViewChild("nodeOutlet", { static: true, read: ViewContainerRef })
	private _nodeOutlet!: ViewContainerRef;

	private _nodes = new Map<string, GraphNode>();
	private _onDestroy$ = new Subject<void>();
	private get _element() { return this._elementRef.nativeElement; }

	constructor (
		@Self() @Inject(GRAPH_VIEW_MODEL) public vm: GraphViewModelService,
		private _elementRef: ElementRef<HTMLElement>,
		private _library: GraphLibrary,
	) {}

	ngOnInit(): void {
		this._libNodes = entries(this._library.nodes)
			.map(([key, value]) => ({
				id: key,
				displayName: value.displayName,
			}));
	}

	ngAfterViewInit(): void {
		this.vm.drawConnections(this._nodes);
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
				this.vm.drawConnections(this._nodes);
			});
	}

	unregisterNode(node: GraphNode): void {
		this._nodes.delete(node.id);
	}

	@HostListener("wheel", ["$event"])
	onZoom(event: WheelEvent): void {
		this.vm.onZoom(event);
	}

	@HostListener("pointerdown", ["$event"])
	onMousedown(event: PointerEvent): void {
		this.vm.onMousedown(event);
	}

	@HostListener("pointermove", ["$event"])
	onMousemove(event: PointerEvent): void {
		this.vm.cursor.x = event.clientX - this._element.offsetLeft;
		this.vm.cursor.y = event.clientY - this._element.offsetTop;
	}

	spawnNode(id: string): void {
		let desc = this._library.descriptor(id);
		let node = this._nodeOutlet
			.createComponent<GraphNode>(desc.type)
			.instance;

		node.name = desc.displayName;
		node.x = Math.round(this.vm.gridCursor.x);
		node.y = Math.round(this.vm.gridCursor.y);
		node.inputs = desc.inputs;
		node.outputs = desc.outputs;
	}
}
