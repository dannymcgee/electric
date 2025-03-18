import { FocusMonitor, FocusOrigin } from "@angular/cdk/a11y";
import {
	Component,
	OnInit,
	ViewEncapsulation,
	ChangeDetectionStrategy,
	OnDestroy,
	Input,
	HostBinding,
	ElementRef,
	Optional,
	Inject,
	Host,
	HostListener,
} from "@angular/core";
import { fromEvent, Observable, Subject, timer } from "rxjs";
import { filter, map, take, takeUntil } from "rxjs/operators";

import { IconName } from "@electric/components/icon";
import { Coerce } from "@electric/ng-utils";
import { array } from "@electric/utils";

import {
	MENU_ITEM,
	MENU_TRIGGER,
	MENUBAR,
	MenuItem,
	MenuItemFocusEvent,
} from "../menu.types";

@Component({
	selector: "elx-menuitem",
	template: `

<elx-icon class="elx-menuitem__icon"
	*ngIf="icon"
	[icon]="icon"
></elx-icon>

<span class="elx-menuitem__label">
	<ng-content></ng-content>
</span>

<span class="elx-menuitem__keybind"
	*ngIf="keybind"
	aria-hidden="true"
>
	{{ keybind }}
</span>

<elx-icon class="elx-menuitem__submenu-icon"
	*ngIf="hasSubmenu"
	icon="ChevronRightSmall"
></elx-icon>

	`,
	styleUrls: ["./menu-item.component.scss"],
	providers: [{
		provide: MENU_ITEM,
		useExisting: MenuItemComponent,
	}],
	encapsulation: ViewEncapsulation.None,
	changeDetection: ChangeDetectionStrategy.OnPush,
	standalone: false,
})
export class MenuItemComponent implements MenuItem, OnInit, OnDestroy {
	@HostBinding("class")
	readonly hostClass = "elx-menuitem";

	@HostBinding("attr.role")
	readonly role = "menuitem";

	@Input() icon?: IconName;
	@Input() keybind?: string;

	@HostBinding("class.disabled")
	@HostBinding("attr.aria-disabled")
	@Coerce(Boolean)
	@Input() disabled = false;

	@HostBinding()
	tabIndex = -1;

	get hasSubmenu() { return !!this._menuTrigger && !this._menubar; }

	focused$!: Observable<MenuItemFocusEvent>;
	pressed$ = new Subject<void>();
	hovered$ = new Subject<HTMLElement>();

	private _onDestroy$ = new Subject<void>();
	private get _element() { return this.elementRef.nativeElement }

	constructor (
		public elementRef: ElementRef<HTMLElement>,
		private _focusMonitor: FocusMonitor,
		@Optional() @Inject(MENU_TRIGGER)
			private _menuTrigger: unknown | null,
		@Optional() @Host() @Inject(MENUBAR)
			private _menubar: unknown | null,
	) {}

	ngOnInit(): void {
		this.focused$ = this._focusMonitor
			.monitor(this.elementRef, false)
			.pipe(
				filter(origin => origin !== null),
				map(origin => ({
					item: this,
					element: this._element,
					origin,
				})),
			);
	}

	ngOnDestroy(): void {
		this._focusMonitor.stopMonitoring(this.elementRef);
		this.pressed$.complete();
		this.hovered$.complete();
		this._onDestroy$.next();
		this._onDestroy$.complete();
	}

	getLabel(): string {
		if (!this._element) return "";

		return array(this._element.children)
			.reduce((accum, child) => {
				if (child.getAttribute("aria-hidden") === "true") {
					return accum;
				}
				return accum + " " + child.textContent;
			}, "");
	}

	focus(origin: FocusOrigin = "program"): void {
		this._focusMonitor.focusVia(this.elementRef, origin);
	}

	@HostListener("mouseenter")
	onMouseenter(): void {
		timer(250).pipe(
			take(1),
			takeUntil(fromEvent(this._element, "mouseleave")),
			takeUntil(this._onDestroy$),
		).subscribe(() => {
			this.hovered$.next(this._element);
		});
	}

	@HostListener("click", ["$event"])
	@HostListener("keydown.enter", ["$event"])
	onMenuItemPressed(event: Event): void {
		if (this.disabled) {
			event.preventDefault();
			event.stopImmediatePropagation();

			return;
		}

		if (event instanceof KeyboardEvent) {
			this._element.click();
		}
		else {
			this.pressed$.next();
		}
	}
}
