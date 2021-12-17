import {
	Component,
	ViewEncapsulation,
	ChangeDetectionStrategy,
	OnInit,
	AfterContentInit,
	OnDestroy,
	HostListener,
	HostBinding,
	Input,
	ContentChildren,
} from "@angular/core";
import { NG_VALUE_ACCESSOR } from "@angular/forms";
import {
	filter,
	map,
	merge,
	startWith,
	Subject,
	switchMap,
	takeUntil,
	tap,
} from "rxjs";

import { DetectChanges, QueryList } from "@electric/ng-utils";
import { assert, Fn } from "@electric/utils";

import {
	CustomControl,
	CUSTOM_CONTROL,
	ValueAccessor,
} from "../../form-controls.types";
import { Radio, RADIO } from "../radio.types";

@Component({
	selector: "elx-radio-group",
	template: `<ng-content></ng-content>`,
	styleUrls: ["./radio-group.component.scss"],
	providers: [{
		provide: CUSTOM_CONTROL,
		useExisting: RadioGroupComponent,
	}, {
		provide: NG_VALUE_ACCESSOR,
		useExisting: RadioGroupComponent,
		multi: true,
	}],
	encapsulation: ViewEncapsulation.None,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RadioGroupComponent<T>
implements
	ValueAccessor<T>,
	CustomControl,
	OnInit,
	AfterContentInit,
	OnDestroy
{
	@HostBinding("class")
	readonly hostClass = "elx-radio-group";

	@HostBinding("attr.role")
	readonly role = "radiogroup";

	@HostBinding("attr.aria-labelledby")
	@DetectChanges()
	@Input() labelId?: string;

	@HostBinding("attr.aria-disabled")
	@Input()
	get disabled() { return this._disabled; }
	set disabled(value) {
		this._disabled = value;
		// Propagate disabled changes to each radio
		if (this._radios) {
			this._radios.forEach(radio => {
				radio.disabled = value;
			});
		}
	}
	private _disabled = false;

	@Input()
	get name() { return this._name; }
	set name(value) {
		this._name = value;
		// Propagate name changes to each radio
		if (this._radios) {
			this._radios.forEach(radio => {
				radio.name = value;
			});
		}
	}
	private _name!: string;

	@ContentChildren(RADIO)
	private _radios?: QueryList<Radio<T>>;

	private _value?: T;
	private _deferredOnTouch?: boolean;
	private _deferredValueChange?: T;

	private _onDestroy$ = new Subject<void>();

	ngOnInit(): void {
		if (!this.name) {
			throw new Error("RadioGroup missing required `name` input");
		}
	}

	ngAfterContentInit(): void {
		assert(this._radios != null);

		this._radios.changes.pipe(
			startWith(this._radios),
			// Update all radio inputs when the QueryList changes
			tap(radios => radios.forEach(radio => {
				radio.name = this.name;
				radio.disabled = this.disabled;
				radio.checked = radio.value === this._value;
			})),
			// SwitchMap to a stream of the currently checked value
			switchMap(radios => {
				let checkedValue = radios
					.map((radio, idx) => radio.checkedChange.pipe(
						filter(checked => checked),
						map(() => radios.get(idx)!.value),
					));
				return merge(...checkedValue);
			}),
			takeUntil(this._onDestroy$),
		).subscribe(value => {
			// Update the model
			this.onChange(value);
			// Update radio inputs
			this._radios!.forEach(radio => {
				radio.checked = radio.value === value;
			});
		});
	}

	ngOnDestroy(): void {
		this._onDestroy$.next();
		this._onDestroy$.complete();
	}

	writeValue(value?: T): void {
		this._value = value;
		if (!this._radios) return;

		this._radios.forEach(radio => {
			radio.checked = radio.value === value;
		});
	}

	private onChange(value?: T) {
		this._onChange(value);
	}

	private _onChange = (value?: T) => {
		this._deferredValueChange = value;
	}

	registerOnChange(fn: Fn<[T?], void>): void {
		this._onChange = fn;
		if (this._deferredValueChange) {
			fn(this._deferredValueChange);
		}
	}

	@HostListener("blur")
	_onTouched() {
		this._deferredOnTouch = true;
	}

	registerOnTouched(fn: Fn<[], void>): void {
		this._onTouched = fn;
		if (this._deferredOnTouch) {
			fn();
		}
	}

	setDisabledState(value: boolean): void {
		this.disabled = value;
	}
}
