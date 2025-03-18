import { DOCUMENT } from "@angular/common";
import {
	ChangeDetectionStrategy,
	Component,
	EventEmitter,
	HostBinding,
	HostListener,
	inject,
	Input,
	OnDestroy,
	Output,
	ViewEncapsulation,
} from "@angular/core";

import { Coerce, injectRef } from "@electric/ng-utils";
import { fromEvent, mapTo, merge, race, Subject, take } from "rxjs";

@Component({
	selector: "elx-function-port",
	template: `

{{ name ?? "" }}

	`,
	styleUrls: ["./port.component.scss"],
	encapsulation: ViewEncapsulation.None,
	changeDetection: ChangeDetectionStrategy.OnPush,
	standalone: false,
})
export class FunctionPortComponent implements OnDestroy {
	@HostBinding("class")
	get hostClasses() {
		let base = "elx-function-port";
		return [
			base,
			`${base}--${this.direction}`,
		];
	}

	@HostBinding("class.connected")
	@Input() @Coerce(Boolean) connected = false;

	@Input() direction!: "input"|"output";
	@Input() name?: string;

	@Output() draggedOut = new EventEmitter<void>();
	@Output() receivedDrop = new EventEmitter<void>();

	private _onDestroy$ = new Subject<void>();
	private get _element() { return this._elementRef.nativeElement; }

	private _document = inject(DOCUMENT);
	private _elementRef = injectRef<HTMLElement>();

	@HostListener("pointerup")
	onPointerup(): void {
		this.receivedDrop.emit();
	}

	@HostListener("pointerdown", ["$event"])
	onPointerdown(event: PointerEvent): void {
		if (event.button !== 0)
			return;

		let cancelled$ = merge(
			this._onDestroy$,
			fromEvent(this._document, "pointerup"),
		).pipe(
			mapTo(false),
		);
		let draggedOut$ = fromEvent(this._element, "pointerleave");

		race(cancelled$, draggedOut$)
			.pipe(take(1))
			.subscribe(event => {
				if (event)
					this.draggedOut.emit();
			});
	}

	ngOnDestroy(): void {
		this._onDestroy$.next();
		this._onDestroy$.complete();
	}
}
