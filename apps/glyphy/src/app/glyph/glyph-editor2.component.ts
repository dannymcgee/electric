import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	HostListener,
	Input,
	OnDestroy,
	OnInit,
} from "@angular/core";
import { ThemeService } from "@electric/components";
import { ElxResizeObserver } from "@electric/ng-utils";
import { assert, Const, exists, Option } from "@electric/utils";
import {
	animationFrameScheduler,
	BehaviorSubject,
	combineLatest,
	distinctUntilChanged,
	filter,
	fromEvent,
	map,
	Observable,
	race,
	shareReplay,
	Subject,
	takeUntil,
	throttleTime,
} from "rxjs";

import { FamilyService } from "../family";
import { Matrix, nearlyEq } from "../math";
import { Rect } from "../render";
import { Glyph } from "./glyph";

@Component({
	selector: "g-glyph-editor",
	templateUrl: "./glyph-editor2.component.html",
	styleUrls: ["./glyph-editor2.component.scss"],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GlyphEditor2Component implements OnInit, OnDestroy {
	@Input() glyph!: Glyph;
	@Input() metricsThickness = 1;
	@Input() pathThickness = 1;
	@Input() handleThickness = 1;

	marquee: Option<Rect> = null;

	contentRect$?: Observable<DOMRect>;
	glyphToCanvas$?: Observable<Const<Matrix>>;
	canvasToGlyph$?: Observable<Const<Matrix>>;

	private _panAndZoom$ = new BehaviorSubject<Matrix>(Matrix.Identity as Matrix);
	panAndZoom$ = this._panAndZoom$.pipe(shareReplay({ bufferSize: 1, refCount: true }));

	private _onDestroy$ = new Subject<void>();

	constructor (
		private _cdRef: ChangeDetectorRef,
		public _familyService: FamilyService,
		private _ref: ElementRef<HTMLElement>,
		private _resizeObserver: ElxResizeObserver,
		public theme: ThemeService,
	) {}

	ngOnInit(): void {
		const resize$ = this._resizeObserver
			.observe(this._ref)
			.pipe(takeUntil(this._onDestroy$));

		this.contentRect$ = resize$.pipe(
			map(entry => entry.contentRect),
			distinctUntilChanged((a, b) => (
				nearlyEq(a.x, b.x)
				&& nearlyEq(a.y, b.y)
				&& nearlyEq(a.width, b.width)
				&& nearlyEq(a.height, b.height)
			)),
			shareReplay({ bufferSize: 1, refCount: true }),
			takeUntil(this._onDestroy$),
		);

		this.glyphToCanvas$ = combineLatest([
			this._familyService.family$.pipe(filter(exists)),
			this.contentRect$,
			this.panAndZoom$,
		]).pipe(
			throttleTime(0, animationFrameScheduler, {
				leading: true,
				trailing: true,
			}),
			map(([family, rect, panAndZoom]) => {
				const { ascender, descender } = family;

				const glyphHeight = ascender - descender;
				const glyphWidth = this.glyph.advance!;

				return Matrix.concat(
					// Center the glyph on the canvas origin
					Matrix.translate(-glyphWidth/2, -glyphHeight/2),
					Matrix.translate(0, -descender),
					// Scale to match the canvas height
					Matrix.scale(rect.height / glyphHeight),
					// Flip vertical
					Matrix.scale(1, -1),
					// Zoom out slightly and center in the canvas
					Matrix.scale(0.8),
					Matrix.translate(rect.width/2, rect.height/2),
					// Apply user pan / zoom
					panAndZoom,
				);
			}),
			shareReplay({ bufferSize: 1, refCount: true }),
			takeUntil(this._onDestroy$),
		);

		this.canvasToGlyph$ = this.glyphToCanvas$.pipe(
			map(matrix => matrix.inverse()),
			shareReplay({ bufferSize: 1, refCount: true }),
			takeUntil(this._onDestroy$),
		);
	}

	ngOnDestroy(): void {
		this._onDestroy$.next();
		this._onDestroy$.complete();
		this._resizeObserver.unobserve(this._ref);
		this._panAndZoom$.complete();
	}

	@HostListener("pointerdown", ["$event"])
	onPointerDown(event: PointerEvent): void {
		if (event.button === 0)
			this.beginMarqueeSelect(event);
	}

	private beginMarqueeSelect(event: PointerEvent): void {
		const { offsetX: xInit, offsetY: yInit } = event;

		this.marquee = {
			x: xInit,
			y: yInit,
			width: 0,
			height: 0,
		};

		fromEvent<PointerEvent>(this._ref.nativeElement, "pointermove")
			.pipe(takeUntil(race(
				fromEvent(window, "pointerup"),
				fromEvent(this._ref.nativeElement, "pointerleave"),
				this._onDestroy$,
			)))
			.subscribe({
				next: event => {
					const left = Math.min(event.offsetX, xInit);
					const top = Math.min(event.offsetY, yInit);
					const width = Math.max(xInit, event.offsetX) - left;
					const height = Math.max(yInit, event.offsetY) - top;

					assert(this.marquee != null);

					this.marquee.x = left;
					this.marquee.y = top;
					this.marquee.width = width;
					this.marquee.height = height;

					this._cdRef.detectChanges();
				},
				complete: () => {
					const bounds = this.marquee!;
					this.marquee = null;

					this.marqueeSelect(bounds);

					this._cdRef.detectChanges();
				},
			});
	}

	private marqueeSelect(bounds: Rect): void {
		console.log("Bounds for selection:", bounds);
	}
}
