import {
	Directive,
	ElementRef,
	EventEmitter,
	Input,
	OnChanges,
	OnDestroy,
	OnInit,
	Output,
	SimpleChanges,
} from "@angular/core";
import { Entry } from "@tidy-api";
import { fromEvent, merge, Observable, Subject, takeUntil } from "rxjs";

export enum InteractionFlags {
	None    = 0b000,
	Hover   = 0b001,
	Focus   = 0b010,
	Pressed = 0b100,
}

@Directive({
	selector: "[tdTableRowInteraction]",
})
export class TableRowInteractionDirective implements OnInit, OnChanges, OnDestroy {
	@Input() entry!: Entry;

	@Input("tdTableRowInteraction")
	state?: [Entry, InteractionFlags];

	@Output("tdTableRowInteractionChange")
	stateChange = new EventEmitter<[Entry, InteractionFlags]>();

	private _flags = InteractionFlags.None;
	private _onDestroy$ = new Subject<void>();

	constructor (
		private _elementRef: ElementRef<HTMLElement>,
	) {}

	ngOnInit(): void {
		let enter$ = this.listen("pointerenter");
		let leave$ = this.listen("pointerleave");

		let down$ = this.listen("pointerdown");
		let up$ = this.listen("pointerup");

		enter$.subscribe(() => this._flags |= InteractionFlags.Hover);
		leave$.subscribe(() => this._flags &= ~InteractionFlags.Hover);

		down$.subscribe(() => this._flags |= InteractionFlags.Pressed);
		up$.subscribe(() => this._flags &= ~InteractionFlags.Pressed);

		merge(enter$, leave$, down$, up$).subscribe(() => {
			console.log("stateChange:", [this.entry, this._flags]);
			this.stateChange.emit([this.entry, this._flags]);
		});
	}

	ngOnChanges(changes: SimpleChanges): void {
		if (!("state" in changes))
			return;

		this.unStyle();

		if (!this.state)
			return;

		let [entry, flags] = this.state;
		if (entry !== this.entry)
			return;

		let { nativeElement: element } = this._elementRef;
		if (flags & InteractionFlags.Hover)
			element.classList.add("hover");
		if (flags & InteractionFlags.Focus)
			element.classList.add("focus");
		if (flags & InteractionFlags.Pressed)
			element.classList.add("active");
	}

	ngOnDestroy(): void {
		this._onDestroy$.next();
		this._onDestroy$.complete();
	}

	private listen(event: string): Observable<PointerEvent> {
		let { nativeElement: element } = this._elementRef;
		return fromEvent<PointerEvent>(element, event)
			.pipe(takeUntil(this._onDestroy$));
	}

	private unStyle(): void {
		let { nativeElement: element } = this._elementRef;
		element.classList.remove("hover", "focus", "active");
	}
}
