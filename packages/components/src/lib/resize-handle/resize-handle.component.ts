import { DOCUMENT } from "@angular/common";
import {
	Component,
	ViewEncapsulation,
	ChangeDetectionStrategy,
	HostBinding,
	Input,
	Output,
	EventEmitter,
	OnDestroy,
	HostListener,
	Inject,
} from "@angular/core";
import { Opt } from "@electric/utils";
import {
	fromEvent,
	merge,
	scan,
	Subject,
	takeUntil,
} from "rxjs";

import {
	Alignment,
	Direction,
	ResizeHandle,
	RESIZE_HANDLE,
	Vec2,
} from "./resize-handle.types";

@Component({
	selector: "elx-resize-handle",
	template: ``,
	styleUrls: ["./resize-handle.component.scss"],
	providers: [{
		provide: RESIZE_HANDLE,
		useExisting: ResizeHandleComponent,
	}],
	encapsulation: ViewEncapsulation.None,
	changeDetection: ChangeDetectionStrategy.OnPush,
	standalone: false,
})
export class ResizeHandleComponent implements ResizeHandle, OnDestroy {
	@HostBinding("class")
	get hostClasses() {
		let base = "elx-resize-handle";
		let result = [base];
		if (this.direction) result.push(`${base}--${this.direction}`);
		if (this.align) result.push(`${base}--${this.align}`);
		return result;
	}

	@HostBinding("class.active")
	_active = false;

	@Input() id?: string;
	@Input() direction?: Direction;
	@Input() align?: Alignment;

	@Output() move = new EventEmitter<Vec2>();

	private _onDestroy$ = new Subject<void>();

	constructor (
		@Inject(DOCUMENT) private _document: Document,
	) {}

	@HostListener("pointerdown", ["$event"])
	onPointerdown(event: PointerEvent): void {
		event.preventDefault();

		this._active = true;
		this._document.documentElement.style
			.setProperty(
				"cursor",
				this.direction === "horizontal"
					? "ew-resize"
					: "ns-resize"
			);

		// NOTE: It's tempting to just use `movementX`/`movementY` here, but MDN
		// warns that browser implementations are not consistent about which units
		// they use (device/hardware pixels or "client"/CSS/DIP pixels). We just
		// compute the deltas manually with `clientX`/`clientY` for the sake of
		// bulletproof consistency.
		// https://github.com/w3c/pointerlock/issues/42
		fromEvent<PointerEvent>(this._document, "pointermove").pipe(
			scan((accum, event) => {
				return {
					prev: accum.current,
					current: event,
				};
			}, {
				prev: null,
				current: null,
			} as {
				prev: Opt<PointerEvent>;
				current: Opt<PointerEvent>;
			}),
			takeUntil(merge(
				fromEvent(this._document, "pointerup"),
				this._onDestroy$,
			)),
		).subscribe({
			next: ({ prev, current }) => {
				if (!current || !prev) {
					this.move.emit(new Vec2(0, 0));
				}
				else {
					this.move.emit(new Vec2(
						current.clientX - prev.clientX,
						current.clientY - prev.clientY,
					));
				}
			},
			complete: () => {
				this._active = false;
				this._document.documentElement.style.removeProperty("cursor");
			},
		});
	}

	ngOnDestroy(): void {
		this._onDestroy$.next();
		this._onDestroy$.complete();
	}
}
