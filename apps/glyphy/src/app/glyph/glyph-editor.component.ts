import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	HostBinding,
	HostListener,
	Input,
	OnChanges,
	OnDestroy,
	OnInit,
	SimpleChanges,
	ViewChild,
} from "@angular/core";
import { ElxResizeObserver } from "@electric/ng-utils";
import {
	assert,
	exists,
	isModifier,
	ModifierKey,
	Option,
} from "@electric/utils";
import {
	BehaviorSubject,
	combineLatest,
	filter,
	fromEvent,
	map,
	merge,
	Observable,
	scan,
	Subject,
	takeUntil,
} from "rxjs";

import { FamilyService } from "../family";
import { Matrix, Vec2, vec2 } from "../math";
import { getViewBox, ViewBox } from "../util/viewbox";
import { Glyph } from "./glyph";

@Component({
	selector: "g-glyph-editor",
	templateUrl: "./glyph-editor.component.html",
	styleUrls: ["./glyph-editor.component.scss"],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GlyphEditorComponent implements OnChanges, OnInit, OnDestroy {
	@Input() glyph!: Glyph;

	@HostBinding("style.--metrics-thickness")
	@Input() metricsThickness = 1;

	@HostBinding("style.--path-thickness")
	@Input() pathThickness = 1;

	@HostBinding("style.--handle-thickness")
	@Input() handleThickness = 1;

	@HostBinding("class.pan-mode")
	isPanMode = false;

	@HostBinding("class.panning")
	isPanning = false;

	@HostBinding("style.--scale-factor")
	_scaleFactor = 1;

	@HostBinding()
	readonly tabIndex = -1;

	@ViewChild("svgRef", { static: true, read: ElementRef })
	private _svgRef!: ElementRef<SVGSVGElement>;

	_pointer?: Vec2;
	_pointerCoords?: Vec2;
	private _pointerClient?: Vec2;

	ModifierKey = ModifierKey; // For template access
	_modifiers: ModifierKey[] = [];

	_clientToView?: Matrix;
	private _viewToClient?: Matrix;
	private _viewBoxTransform?: Matrix;

	private _panOffset = Matrix.translate(0, 0);
	private _zoom = Matrix.scale(1);

	// TODO: On the one hand, this is begging to be optimized. On the other hand,
	// the vast majority of the perf hit here comes from Angular (change
	// detection, property bindings, etc.) and the browser (layout, hit test,
	// paint, etc.). Should look into optimizing those areas before worrying
	// about trying to cache or memoize this.
	//
	// Either way, I'm still hitting 60 frames with plenty of overhead, so
	// optimization will be a problem for Future Danny.
	get renderTransform() {
		return Matrix.concat(...[
			this._clientToView,
			this._panOffset,
			this._zoom,
			this._viewToClient,
			this._viewBoxTransform,
		].filter(exists));
	}

	_viewBox$ = new BehaviorSubject<ViewBox|null>(null);

	private _zoomFactor$ = new BehaviorSubject<number>(1.333333);
	private _scaleFactor$?: Observable<number>;
	private _viewChange$?: Observable<[number, ViewBox]>;
	private _onDestroy$ = new Subject<void>();

	constructor (
		private _cdRef: ChangeDetectorRef,
		private _elRef: ElementRef<HTMLElement>,
		public _familyService: FamilyService,
		private _resizeObserver: ElxResizeObserver,
	) {}

	ngOnChanges(changes: SimpleChanges): void {
		if ("glyph" in changes && this.glyph) {
			if (changes["glyph"].firstChange) {
				this._scaleFactor$ = combineLatest([
					this._familyService.family$,
					this._zoomFactor$,
					this._resizeObserver.observe(this._elRef),
				]).pipe(
					filter(([family]) => exists(family)),
					map(([family, zoom, resize]) => {
						const { ascender, descender } = family!;
						const height = (ascender - descender) * zoom;
						const bounds = resize.contentRect;

						return height / bounds.height;
					}),
					filter(scale => Number.isFinite(scale) && !Number.isNaN(scale)),
					takeUntil(this._onDestroy$),
				);

				this._viewChange$ = combineLatest([
					this._scaleFactor$,
					this._viewBox$.pipe(filter(exists)),
				]).pipe(
					takeUntil(this._onDestroy$),
				);
			}
			this.updateViewbox();
		}
	}

	ngOnInit(): void {
		assert(this._viewChange$ != null);

		this._viewChange$.subscribe(([scale, viewBox]) => {
			this._scaleFactor = scale;

			const ctm = this._svgRef.nativeElement.getCTM()!;
			this._viewToClient = Matrix.from(ctm);
			this._clientToView = Matrix.from(ctm.inverse());

			const { x, y, width, height } = viewBox;
			this._viewBoxTransform = Matrix.concat(
				Matrix.translate(x + width/2, y + height/2),
				Matrix.scale(1, -1),
				Matrix.translate(-x - width/2, -y - height/2),
			);

			this._cdRef.detectChanges();
		});
	}

	ngOnDestroy(): void {
		this._viewBox$.complete();
		this._onDestroy$.next();
		this._onDestroy$.complete();
		this._resizeObserver.unobserve(this._elRef);
	}

	private updateViewbox(): void {
		this._viewBox$.next(getViewBox(this._familyService.font!, this.glyph, 1.333333));
	}

	@HostListener("window:resize")
	onResize(): void {
		this.updateViewbox();
	}

	@HostListener("window:keydown", ["$event"])
	onKeyDown(event: KeyboardEvent): void {
		// TODO: Make hotkeys configurable
		if (isModifier(event.key, { excludeLocks: true })) {
			this._modifiers = this._modifiers.concat(event.key);
		}
		else if (event.key === " ") {
			this.isPanMode = true;
		}
	}

	@HostListener("window:keyup", ["$event"])
	onKeyUp(event: KeyboardEvent): void {
		if (isModifier(event.key, { excludeLocks: true })) {
			this._modifiers = this._modifiers.filter(mod => mod !== event.key);
		}
		else if (event.key === " ") {
			this.isPanMode = false;
		}
	}

	@HostListener("pointerenter", ["$event"])
	onPointerEnter(event: PointerEvent): void {
		this.initPointer(event);
	}

	@HostListener("pointerleave")
	onPointerLeave(): void {
		this.removePointer();
	}

	@HostListener("pointermove", ["$event"])
	onPointerMove(event: PointerEvent): void {
		this.updatePointer(event);
	}

	@HostListener("pointerdown", ["$event"])
	onPointerDown(event: PointerEvent): void {
		// TODO: Make pan button configurable
		if (event.button === 1
			|| (event.button === 0 && this.isPanMode))
		{
			return this.initPanning();
		}
	}

	@HostListener("wheel", ["$event"])
	onWheel({ deltaY, offsetX, offsetY }: WheelEvent): void {
		const delta = deltaY / (175 * 7.5); // TODO: Adjustable sensitivity
		this.adjustZoom(delta, offsetX, offsetY);
	}

	private initPanning(): void {
		this.isPanning = true;

		fromEvent<PointerEvent>(this._elRef.nativeElement, "pointermove")
			.pipe(
				scan((accum, event) => ({
					prev: accum.current,
					current: event,
				}), {
					prev: null,
					current: null,
				} as {
					prev: Option<PointerEvent>,
					current: Option<PointerEvent>,
				}),
				map(({ prev, current }) => {
					if (!current || !prev) return vec2(0, 0);
					return vec2(
						current.clientX - prev.clientX,
						current.clientY - prev.clientY,
					);
				}),
				takeUntil(merge(
					fromEvent(this._svgRef.nativeElement, "pointerleave"),
					fromEvent(document, "pointerup"),
					this._onDestroy$,
				)),
			)
			.subscribe({
				next: delta => {
					this._panOffset.m31 += delta.x;
					this._panOffset.m32 += delta.y;
				},
				complete: () => {
					this.isPanning = false;
				},
			});
	}

	private adjustZoom(delta: number, offsetX: number, offsetY: number): void {
		const pointer = vec2(offsetX, offsetY);

		this._zoom = Matrix.concat(
			this._panOffset.inverse(),
			Matrix.translate(pointer.x, pointer.y),
			Matrix.scale(1 - delta),
			Matrix.translate(-pointer.x, -pointer.y),
			this._panOffset,
			this._zoom,
		);

		this._scaleFactor /= (1 - delta);
		// TODO: Update _zoomFactor$
	}

	private initPointer(event: PointerEvent): void {
		if (!this._clientToView) return;

		const { offsetX, offsetY } = event;

		this._pointerClient = vec2(offsetX, offsetY);
		this._pointer = this._clientToView.transformPoint(this._pointerClient);
		this._pointerCoords = this.renderTransform.inverse().transformPoint(this._pointer);
	}

	private updatePointer(event: PointerEvent): void {
		if (!this._clientToView) return;

		if (!this._pointerClient)
			return this.initPointer(event);

		assert(this._pointer != null);
		assert(this._pointerCoords != null);

		const { offsetX, offsetY } = event;

		this._pointerClient.x = this._pointer.x = offsetX;
		this._pointerClient.y = this._pointer.y = offsetY;
		this._clientToView.transformPoint_inPlace(this._pointer);

		this._pointerCoords.x = this._pointer.x;
		this._pointerCoords.y = this._pointer.y;
		this.renderTransform.inverse().transformPoint_inPlace(this._pointerCoords);
	}

	private removePointer(): void {
		this._pointer = undefined;
		this._pointerClient = undefined;
		this._pointerCoords = undefined;
	}
}
