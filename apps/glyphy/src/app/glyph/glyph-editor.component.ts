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
	ViewEncapsulation,
} from "@angular/core";
import { assert, exists, Option } from "@electric/utils";
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
import { GlyphScaleFactorProvider } from "./glyph-scale-factor.service";

@Component({
	selector: "svg[g-glyph-editor]",
	templateUrl: "./glyph-editor.component.svg",
	styleUrls: ["./glyph-editor.component.scss"],
	providers: [GlyphScaleFactorProvider],
	changeDetection: ChangeDetectionStrategy.OnPush,
	encapsulation: ViewEncapsulation.None,
})
export class GlyphEditorComponent implements OnChanges, OnInit, OnDestroy {
	@Input() glyph!: Glyph;

	@HostBinding("style.--metrics-thickness")
	@Input() metricsThickness = 1;

	@HostBinding("style.--path-thickness")
	@Input() pathThickness = 1;

	@HostBinding("style.--handle-thickness")
	@Input() handleThickness = 1;

	@HostBinding("class")
	readonly hostClass = "g-glyph-editor";

	@HostBinding("attr.viewBox")
	get viewBoxAttr() {
		if (!this._viewBox$.value) return "0 0 1000 1000";

		const { x, y, width, height } = this._viewBox$.value;
		return `${x} ${y} ${width} ${height}`
	}

	@HostBinding("style.--scale-factor")
	_scaleFactor = 1;

	_pointer?: Vec2;
	_pointerCoords?: Vec2;
	private _pointerClient?: Vec2;

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
	private _scaleFactor$?: Observable<number>;
	private _viewChange$?: Observable<[number, ViewBox]>;
	private _onDestroy$ = new Subject<void>();

	constructor (
		private _cdRef: ChangeDetectorRef,
		public _familyService: FamilyService,
		private _scaleProvider: GlyphScaleFactorProvider,
		private _svgRef: ElementRef<SVGSVGElement>,
	) {}

	ngOnChanges(changes: SimpleChanges): void {
		if ("glyph" in changes && this.glyph) {
			if (changes["glyph"].firstChange) {
				this._scaleFactor$ = this._scaleProvider.scaleFactor$;
				this._viewChange$ = combineLatest([
					this._scaleFactor$,
					this._viewBox$.pipe(filter(exists)),
				]).pipe(
					takeUntil(this._onDestroy$),
				);

				this._scaleProvider.update(true);
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
	}

	private updateViewbox(): void {
		this._viewBox$.next(getViewBox(this._familyService.font!, this.glyph, 1.333333));
	}

	@HostListener("window:resize")
	onResize(): void {
		this._scaleProvider.update();
		this.updateViewbox();
	}

	@HostListener("pointerenter", ["$event"])
	onPointerEnter({ offsetX, offsetY }: PointerEvent): void {
		if (!this._clientToView) return;

		this._pointerClient = vec2(offsetX, offsetY);
		this._pointer = this._clientToView.transformPoint(this._pointerClient);
		this._pointerCoords = this.renderTransform.inverse().transformPoint(this._pointer);
	}

	@HostListener("pointerleave")
	onPointerLeave(): void {
		this._pointer = undefined;
		this._pointerClient = undefined;
	}

	@HostListener("pointermove", ["$event"])
	onPointerMove({ offsetX, offsetY }: PointerEvent): void {
		assert(this._pointer != null);
		assert(this._pointerClient != null);
		assert(this._pointerCoords != null);
		assert(this._clientToView != null);

		this._pointerClient.x = this._pointer.x = offsetX;
		this._pointerClient.y = this._pointer.y = offsetY;
		this._clientToView.transformPoint_inPlace(this._pointer);

		this._pointerCoords.x = this._pointer.x;
		this._pointerCoords.y = this._pointer.y;
		this.renderTransform.inverse().transformPoint_inPlace(this._pointerCoords);
	}

	@HostListener("pointerdown", ["$event"])
	onPointerDown(event: PointerEvent): void {
		if (event.button === 1) {
			// middle-mouse pan
			fromEvent<PointerEvent>(this._svgRef.nativeElement, "pointermove")
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
				.subscribe(delta => {
					this._panOffset.m31 += delta.x;
					this._panOffset.m32 += delta.y;
				});
		}
	}

	@HostListener("wheel", ["$event"])
	onWheel(event: WheelEvent): void {
		// Scroll to zoom
		const delta = event.deltaY / (175 * 7.5); // TODO: Adjustable sensitivity
		const pointer = vec2(event.offsetX, event.offsetY);

		this._zoom = Matrix.concat(
			this._panOffset.inverse(),
			Matrix.translate(pointer.x, pointer.y),
			Matrix.scale(1 - delta),
			Matrix.translate(-pointer.x, -pointer.y),
			this._panOffset,
			this._zoom,
		);

		this._scaleFactor /= (1 - delta);
	}
}
