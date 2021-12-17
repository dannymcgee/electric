import { FocusableOption, FocusMonitor, FocusOrigin } from "@angular/cdk/a11y";
import { ContentObserver } from "@angular/cdk/observers";
import {
	Component,
	ViewEncapsulation,
	ChangeDetectionStrategy,
	HostBinding,
	Input,
	Output,
	EventEmitter,
	ElementRef,
	HostListener,
	OnInit,
	OnDestroy,
	Self,
} from "@angular/core";
import { BehaviorSubject, ReplaySubject, Subject, takeUntil } from "rxjs";

import { Coerce, DetectChanges, ElxResizeObserver } from "@electric/ng-utils";
import { elementId, getLabel } from "@electric/utils";

import { TAB, Tab } from "../tabs.types";

@Component({
	selector: "elx-tab, [elx-tab]",
	template: `<ng-content></ng-content>`,
	styleUrls: ["./tab.component.scss"],
	providers: [
		ElxResizeObserver,
		{
			provide: TAB,
			useExisting: TabComponent,
		},
	],
	encapsulation: ViewEncapsulation.None,
	changeDetection: ChangeDetectionStrategy.OnPush,
	exportAs: "tab",
})
export class TabComponent
implements
	OnInit,
	OnDestroy,
	Tab,
	FocusableOption
{
	@HostBinding("class")
	readonly hostClass = "elx-tab";

	@HostBinding("attr.role")
	readonly role = "tab";

	@HostBinding()
	readonly tabIndex = -1;

	@HostBinding("attr.id")
	@Input() id = elementId("tab");

	@HostBinding("class.disabled")
	@HostBinding("attr.aria-disabled")
	@Coerce(Boolean)
	@DetectChanges()
	@Input() disabled = false;

	@HostBinding("class.active")
	@HostBinding("attr.aria-selected")
	@Coerce(Boolean)
	@DetectChanges()
	@Input() active = false;

	@HostBinding("attr.aria-controls")
	@DetectChanges()
	controls?: string;

	@HostBinding("attr.data-label")
	@DetectChanges()
	_label?: string;

	@Output() select = new EventEmitter<void>();

	get hoverChanges$() { return this._hoverChange$.asObservable(); }
	private _hoverChange$ = new BehaviorSubject(false);

	private _width$ = new ReplaySubject<number>();
	readonly width$ = this._width$.asObservable();

	private _onDestroy$ = new Subject<void>();

	constructor (
		private _contentObserver: ContentObserver,
		private _elementRef: ElementRef<HTMLElement>,
		private _focusMonitor: FocusMonitor,
		@Self() private _resizeObserver: ElxResizeObserver,
	) {}

	ngOnInit(): void {
		this._label = this.getLabel();

		this._contentObserver
			.observe(this._elementRef)
			.pipe(takeUntil(this._onDestroy$))
			.subscribe(() => {
				this._label = this.getLabel();
			});

		this._resizeObserver
			.observe(this._elementRef, { box: "border-box" })
			.pipe(takeUntil(this._onDestroy$))
			.subscribe(entry => {
				this._width$.next(entry.borderBoxSize[0].inlineSize);
			});
	}

	ngOnDestroy(): void {
		this._onDestroy$.next();
		this._onDestroy$.complete();
	}

	focus(origin?: FocusOrigin): void {
		this._focusMonitor.focusVia(this._elementRef, origin ?? null);
	}

	getLabel(): string {
		return getLabel(this._elementRef.nativeElement);
	}

	@HostListener("click")
	onClick(): void {
		this.select.emit();
	}

	@HostListener("mouseenter")
	onMouseenter(): void {
		this._hoverChange$.next(true);
	}

	@HostListener("mouseleave")
	onMouseleave(): void {
		this._hoverChange$.next(false);
	}
}
