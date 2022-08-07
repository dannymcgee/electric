import {
	ComponentRef,
	Directive,
	DoCheck,
	EventEmitter,
	Injector,
	Input,
	OnDestroy,
	OnInit,
	Type,
	ViewContainerRef,
} from "@angular/core";
import { assertType, Fn, keys } from "@electric/utils";
import { Subject, takeUntil } from "rxjs";

import { Changes, OnChanges } from "./changes";

@Directive({
	selector: "[elxComponentOutlet]"
})
export class ComponentOutletDirective<T>
	implements OnChanges, OnInit, DoCheck, OnDestroy
{
	@Input("elxComponentOutlet") Ctor!: Type<T>;
	@Input("elxComponentOutletInputs") inputs?: Partial<Properties<T>>;
	@Input("elxComponentOutletOutputs") outputs?: Partial<Events<T>>;
	@Input("elxComponentOutletInjector") injector?: Injector;
	@Input("elxComponentOutletContent") content?: Node[][];

	get instance(): T | null {
		return this._componentRef?.instance ?? null;
	}

	private _inputValues: Partial<Properties<T>> = {};
	private _handlersInvalidated$ = new Subject<void>();
	private _componentRef?: ComponentRef<T>;

	constructor (
		private _viewContainer: ViewContainerRef,
	) {}

	ngOnChanges(changes: Changes<this>): void {
		if (changes.Ctor || changes.injector || changes.content) {
			this._viewContainer.clear();
			this._componentRef = undefined;
			this._handlersInvalidated$.next();

			const injector = this.injector ?? this._viewContainer.injector;

			this._componentRef = this._viewContainer.createComponent(this.Ctor, {
				index: this._viewContainer.length,
				injector,
				projectableNodes: this.content,
			});
		}

		if (!this._componentRef)
			return;

		const { instance } = this._componentRef;

		if (this.inputs)
			for (let key of keys(this.inputs))
				instance[key] = this.inputs[key]!;

		if (this.outputs) {
			for (let key of keys(this.outputs)) {
				const emitter = instance[key];
				const callback = this.outputs[key];

				assertType<EventEmitter<unknown>>(emitter);

				emitter
					.pipe(takeUntil(this._handlersInvalidated$))
					.subscribe({ next: callback });
			}
		}
	}

	ngOnInit(): void {
		if (this.inputs)
			for (let key of keys(this.inputs))
				this._inputValues[key] = this.inputs[key];
	}

	ngDoCheck(): void {
		if (!this.inputs || !this._componentRef)
			return;

		const { instance } = this._componentRef;
		let needsCheck = false;

		for (let key of keys(this.inputs)) {
			if (this._inputValues[key] !== this.inputs[key]) {
				this._inputValues[key] = this.inputs[key];
				instance[key] = this.inputs[key]!;
				needsCheck = true;
			}
		}

		if (needsCheck)
			this._componentRef.changeDetectorRef.markForCheck();
	}

	ngOnDestroy(): void {
		this._handlersInvalidated$.next();
		this._handlersInvalidated$.complete();
	}
}

type Properties<T> = {
	[K in keyof T]: T[K] extends Fn
		? never
		: T[K];
}

type Events<T> = {
	[K in keyof T]: T[K] extends EventEmitter<infer V>
		? Fn<[V], void>
		: never;
}
