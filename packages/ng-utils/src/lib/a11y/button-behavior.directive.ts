import { coerceBooleanProperty } from "@angular/cdk/coercion";
import { Directive, ElementRef, HostBinding, HostListener, Input } from "@angular/core";

@Directive({
	selector: "[role=\"button\"]",
	standalone: false,
})
export class ButtonBehaviorDirective {
	@Input()
	get disabled() { return this._disabled; }
	set disabled(value) {
		this._disabled = coerceBooleanProperty(value);
		if (
			this._element instanceof HTMLButtonElement
			|| this._element instanceof HTMLInputElement
		) {
			this._element.disabled = this._disabled;
		} else {
			if (value) {
				this._element.setAttribute("aria-disabled", "true");
			} else {
				this._element.removeAttribute("aria-disabled");
			}
		}
	}
	private _disabled?: boolean;

	@HostBinding()
	get tabIndex(): number {
		if (this._disabled) return -1;
		return 0;
	}

	private get _element() { return this._elementRef.nativeElement; }

	constructor (
		private _elementRef: ElementRef<HTMLElement>,
	) {}

	@HostListener("keydown.enter")
	@HostListener("keydown.space", ["$event"])
	_emitClick(event?: Event): void {
		event?.preventDefault();
		this._element?.click();
	}
}
