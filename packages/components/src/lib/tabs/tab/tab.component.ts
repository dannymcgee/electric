import { FocusableOption, FocusMonitor, FocusOrigin } from "@angular/cdk/a11y";
import { ContentObserver } from "@angular/cdk/observers";
import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	EventEmitter,
	HostBinding,
	HostListener,
	inject,
	Input,
	OnDestroy,
	OnInit,
	Output,
	Self,
	ViewEncapsulation,
} from "@angular/core";
import {
	BehaviorSubject,
	filter,
	fromEvent,
	merge,
	ReplaySubject,
	Subject,
	take,
	takeUntil,
} from "rxjs";

import { Coerce, DetectChanges, ElxResizeObserver } from "@electric/ng-utils";
import { elementId, getLabel } from "@electric/utils";

import { TAB, Tab } from "../tabs.types";

@Component({
	selector: "elx-tab, [elx-tab]",
	template: `

	<ng-content></ng-content>

	<elx-icon *ngIf="removable"
		class="elx-tab__close"
		icon="CancelSmall"
		(click)="onRemove($event)"
	></elx-icon>

	`,
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
	implements OnInit, OnDestroy, Tab, FocusableOption
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

	@HostBinding("class.removable")
	@Coerce(Boolean)
	@Input() removable = false;

	@HostBinding("attr.aria-controls")
	readonly panelId = elementId("tab-panel");

	@HostBinding("attr.data-label")
	@DetectChanges()
	_label?: string;

	@Output() select = new EventEmitter<void>();
	@Output() remove = new EventEmitter<void>();

	get hoverChanges$() { return this._hoverChange$.asObservable(); }
	private _hoverChange$ = new BehaviorSubject(false);

	private _width$ = new ReplaySubject<number>();
	readonly width$ = this._width$.asObservable();

	private _onDestroy$ = new Subject<void>();

	private _cdRef = inject(ChangeDetectorRef);
	get changeDetector() { return this._cdRef; }

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

	@HostListener("keydown.delete")
	onRemove(event?: Event): void {
		if (!this.removable) return;

		event?.stopImmediatePropagation();
		this.remove.emit();
	}

	@HostListener("click")
	onClick(): void {
		this.select.emit();
	}

	@HostListener("pointerdown", ["$event"])
	onPointerDown(event: PointerEvent): void {
		if (!this.removable || event.button !== 1) return;

		// Close the tab on middle-click
		fromEvent<PointerEvent>(this._elementRef.nativeElement, "pointerup")
			.pipe(
				take(1),
				takeUntil(merge(
					this._onDestroy$,
					// Cancel if the pointer leaves the element before the button is released
					this._hoverChange$.pipe(filter(hovered => !hovered)),
				)),
			)
			.subscribe(() => {
				this.remove.emit();
			});
	}

	@HostListener("keydown.delete")
	onDelete(): void {
		if (!this.removable) return;
		this.remove.emit();
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
