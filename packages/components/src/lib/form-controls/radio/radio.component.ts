import { FocusMonitor } from "@angular/cdk/a11y";
import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	HostBinding,
	HostListener,
	inject,
	Input,
	OnDestroy,
	OnInit,
	Output,
	ViewEncapsulation,
} from "@angular/core";

import { DetectChanges, injectRef } from "@electric/ng-utils";
import { elementId } from "@electric/utils";
import { Subject, takeUntil } from "rxjs";

import { RADIO, Radio } from "./radio.types";

@Component({
	selector: "elx-radio",
	template: `

<div class="elx-radio__radio"
	[class.elx-radio__radio--checked]="checked"
>
	<input class="elx-radio__input"
		type="radio"
		[name]="name"
		[id]="id"
		[checked]="checked"
		(change)="checkedChange.emit(true)"
	/>
</div>
<label class="elx-radio__label"
	[attr.for]="id"
><ng-content /></label>

	`,
	styleUrls: ["./radio.component.scss"],
	providers: [{
		provide: RADIO,
		useExisting: RadioComponent,
	}],
	encapsulation: ViewEncapsulation.None,
	changeDetection: ChangeDetectionStrategy.OnPush,
	standalone: false,
})
export class RadioComponent<T> implements Radio<T>, OnInit, OnDestroy {
	@HostBinding("class")
	readonly hostClass = "elx-radio";

	@DetectChanges()
	@Input() name?: string;

	@DetectChanges()
	@Input() value!: T;

	@DetectChanges()
	@Input() disabled?: boolean;

	@HostBinding("class.checked")
	@DetectChanges()
	@Input() checked!: boolean;
	@Output() checkedChange = new EventEmitter<boolean>();

	@Input() id!: string;

	@HostBinding("class.focus")
	@DetectChanges()
	_focused?: boolean;

	private _cdRef = inject(ChangeDetectorRef);
	get changeDetector() { return this._cdRef; }

	private _onDestroy$ = new Subject<void>();
	private _elementRef = injectRef<HTMLElement>();
	private _focusMonitor = inject(FocusMonitor);

	ngOnInit(): void {
		if (!this.id) {
			this.id = elementId("radio");
		}

		this._focusMonitor
			.monitor(this._elementRef, true)
			.pipe(takeUntil(this._onDestroy$))
			.subscribe(origin => {
				this._focused = origin === "keyboard";
			});
	}

	ngOnDestroy(): void {
		this._focusMonitor.stopMonitoring(this._elementRef);
		this._onDestroy$.next();
		this._onDestroy$.complete();
	}

	@HostListener("click")
	onClick(): void {
		this.checkedChange.emit(true);
	}
}
