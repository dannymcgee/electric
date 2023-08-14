import {
	Directive,
	ElementRef,
	EventEmitter,
	HostBinding,
	Input,
	OnDestroy,
	Output,
} from "@angular/core";
import { Fn } from "@electric/utils";

import { KeybindRegistry } from "./keybind-registry.service";
import { normalize } from "./keybind-util";

@Directive({
	selector: "[keybind]"
})
export class KeybindDirective implements OnDestroy {
	@Input()
	get keybind() { return this._keybind; }
	set keybind(value) {
		this.registerKeybind(value);
		this._keybind = value;
	}
	private _keybind!: string;

	@HostBinding("ariaKeyShortcuts")
	get _ariaKeyShortcuts() { return normalize(this._keybind) || null; }

	@Output() keyShortcut = new EventEmitter<KeyboardEvent>();

	private get _element(): HTMLElement | null { return this._elementRef?.nativeElement ?? null; }

	constructor (
		private _elementRef: ElementRef<HTMLElement>,
		private _registry: KeybindRegistry,
	) {}

	ngOnDestroy() {
		if (this.keybind)
			this._registry.unregister(normalize(this.keybind), this.handler!);
	}

	private handler?: Fn<[KeyboardEvent?], any>;

	private registerKeybind(value?: string) {
		if (!value) return;

		const normalized = normalize(value);
		const prevNormalized = normalize(this._keybind);

		if (normalized && prevNormalized && normalized !== prevNormalized)
			this._registry.unregister(prevNormalized, this.handler!);

		this.handler = this.keyShortcut.observed
			// If there's an event bound to the `keyShortcut` output, emit the
			// event when the keybind is pressed
			? event => this.keyShortcut.emit(event)
			// Otherwise, click the element if it's valid and not disabled
			: () => {
				if (
					this._element
					&& !(this._element as any)["disabled"]
					&& this._element.ariaDisabled !== "true"
				)
					this._element.click();
			};

		this._registry.register(normalized, this.handler);
	}
}
