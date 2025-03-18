import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	HostBinding,
	HostListener,
	inject,
	Input,
	OnDestroy,
	OnInit,
} from "@angular/core";
import { ThemeService } from "@electric/components";
import { injectRef } from "@electric/ng-utils";
import { cursor } from "@electric/style";
import { Const, Opt, exists, replayUntil } from "@electric/utils";
import {
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
} from "rxjs";

import { FamilyService } from "../family";
import { Matrix } from "../math";
import tauri from "../tauri.bridge";
import { InputProvider, PenToolVariant, ToolMode, ViewRectProvider } from "./editor";
import { Glyph } from "./glyph";

@Component({
	selector: "g-glyph-editor",
	templateUrl: "./glyph-editor.component.html",
	styleUrls: ["./glyph-editor.component.scss"],
	providers: [
		InputProvider,
		ViewRectProvider,
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
	standalone: false,
})
export class GlyphEditorComponent implements OnInit, AfterViewInit, OnDestroy {
	@Input() glyph!: Glyph;
	@Input() metricsThickness = 1;
	@Input() pathThickness = 1;
	@Input() handleThickness = 1;

	@HostBinding("class")
	get activeTool() { return this._activeTool; }
	set activeTool(value) {
		this._activeTool = value;
		const { style } = this._ref.nativeElement;
		style.removeProperty("cursor");
	}
	private _activeTool: ToolMode = "select";

	passiveTool: ToolMode = "select";

	@HostBinding("class.panning")
	isPanning = false;

	private _onDestroy$ = new Subject<void>();

	private _panAndZoom$ = new BehaviorSubject(Matrix.Identity);
	readonly panAndZoom$ = this._panAndZoom$.pipe(replayUntil(this._onDestroy$));

	get contentRect$() { return this._rect.contentRect$; }
	glyphToCanvas$?: Observable<Const<Matrix>>;
	canvasToGlyph$?: Observable<Const<Matrix>>;

	private _cdRef = inject(ChangeDetectorRef);
	_familyService = inject(FamilyService);
	private _input = inject(InputProvider);
	private _ref = injectRef<HTMLElement>();
	private _rect = inject(ViewRectProvider);
	theme = inject(ThemeService);

	ngOnInit(): void {
		this.glyphToCanvas$ = combineLatest([
			this._familyService.family$.pipe(
				filter(exists),
				distinctUntilChanged(),
			),
			this.contentRect$,
			this.panAndZoom$,
		]).pipe(
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
			distinctUntilChanged(),
			takeUntil(this._onDestroy$),
		);

		this.canvasToGlyph$ = this.glyphToCanvas$.pipe(
			map(matrix => matrix.inverse()),
			replayUntil(this._onDestroy$),
		);
	}

	ngAfterViewInit(): void {
		this._cdRef.markForCheck();
	}

	ngOnDestroy(): void {
		this._onDestroy$.next();
		this._onDestroy$.complete();
		this._panAndZoom$.complete();
	}

	@HostListener("window:keydown", ["$event"])
	async onKeyDown(event: KeyboardEvent): Promise<void> {
		// TODO: Make hotkeys configurable
		if (event.key === " ")
			this.activeTool = "pan";

		else if (this.activeTool === "pen"
			// FIXME: Need an abstraction for checking platform-conventional modifier keys
			&& (event.key === "Control"
				|| await tauri.platform() === "darwin" && event.key === "Meta"))
		{
			this.activeTool = "select";
		}
	}

	@HostListener("window:keyup", ["$event"])
	async onKeyUp(event: KeyboardEvent): Promise<void> {
		if (event.key === " "
			|| (this.passiveTool === "pen"
			&& (event.key === "Control"
				|| await tauri.platform() === "darwin" && event.key === "Meta")))
		{
			this.activeTool = this.passiveTool;
		}
	}

	@HostListener("pointerdown", ["$event"])
	onPointerDown(event: PointerEvent): void {
		// TODO: Make pan button configurable
		if (event.button === 1
			|| (event.button === 0 && this.activeTool === "pan"))
		{
			this.beginPan();
		}
	}

	@HostListener("wheel", ["$event"])
	onWheel({ deltaY, offsetX, offsetY }: WheelEvent): void {
		const delta = deltaY / (175 * 7.5); // TODO: Adjustable sensitivity
		this.adjustZoom(delta, offsetX, offsetY);
	}

	setPenCursorVariant(variant: Opt<PenToolVariant>): void {
		const { style } = this._ref.nativeElement;
		if (!variant)
			style.removeProperty("cursor");
		else
			style.setProperty("cursor", cursor.pen(variant));
	}

	private beginPan(): void {
		this.isPanning = true;

		this._input.ptrMove()
			.pipe(takeUntil(race(
				fromEvent(this._ref.nativeElement, "pointerleave"),
				fromEvent(document, "pointerup"),
				this._onDestroy$,
			)))
			.subscribe({
				next: ({ x: dx, y: dy }) => {
					const matrix = this._panAndZoom$.value;

					this._panAndZoom$.next(Matrix.concat(
						matrix,
						Matrix.translate(dx, dy),
					));
				},
				complete: () => {
					this.isPanning = false;
				},
			});
	}

	private adjustZoom(delta: number, originX: number, originY: number): void {
		const matrix = this._panAndZoom$.value;

		this._panAndZoom$.next(Matrix.concat(
			matrix,
			Matrix.translate(-originX, -originY),
			Matrix.scale(1 - delta),
			Matrix.translate(originX, originY),
		));
	}
}
