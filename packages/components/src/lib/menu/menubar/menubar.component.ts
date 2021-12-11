import { FocusKeyManager, FocusMonitor, FocusOrigin } from "@angular/cdk/a11y";
import { DOCUMENT } from "@angular/common";
import {
	Component,
	ViewEncapsulation,
	ChangeDetectionStrategy,
	AfterContentInit,
	OnDestroy,
	HostBinding,
	ContentChildren,
	QueryList,
	Inject,
	ElementRef,
	HostListener,
} from "@angular/core";
import {
	combineLatest,
	distinctUntilChanged,
	filter,
	fromEvent,
	map,
	merge,
	Observable,
	shareReplay,
	startWith,
	Subject,
	switchMap,
	takeUntil,
	tap,
	withLatestFrom,
} from "rxjs";

import { fromKeydown } from "@electric/utils";

import {
	MENU_ITEM,
	MENU_TRIGGER,
	MENUBAR,
	MenuItem,
	MenuTrigger,
} from "../menu.types";

@Component({
	selector: "elx-menubar",
	template: `<ng-content></ng-content>`,
	styleUrls: ["./menubar.component.scss"],
	providers: [{
		provide: MENUBAR,
		useExisting: MenubarComponent
	}],
	encapsulation: ViewEncapsulation.None,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenubarComponent implements AfterContentInit, OnDestroy {
	@HostBinding("class")
	readonly hostClass = "elx-menubar";

	@HostBinding("attr.role")
	readonly role = "menubar";

	@HostBinding()
	tabIndex = 0;

	@ContentChildren(MENU_ITEM, { descendants: false })
	private _menuItems?: QueryList<MenuItem>;
	private _menuItems$?: Observable<QueryList<MenuItem>>;

	@ContentChildren(MENU_TRIGGER, { descendants: false })
	private _menuTriggers?: QueryList<MenuTrigger>;
	private _menuTriggers$?: Observable<QueryList<MenuTrigger>>;

	private _openMenuIndex$?: Observable<number>;
	private _keyPresses$?: Observable<KeyboardEvent>;
	private _keyManager?: FocusKeyManager<MenuItem>;
	private _onDestroy$ = new Subject<void>();

	constructor (
		@Inject(DOCUMENT) private _document: Document,
		private _elementRef: ElementRef<HTMLElement>,
		private _focusMonitor: FocusMonitor,
	) {}

	ngAfterContentInit(): void {
		this._menuItems$ = this._menuItems!
			.changes
			.pipe(startWith(this._menuItems!));

		this._menuTriggers$ = this._menuTriggers!
			.changes
			.pipe(startWith(this._menuTriggers!));

		this._keyPresses$ = fromKeydown(this._document, /^Arrow(Left|Right)$/);
		this._openMenuIndex$ = this.initOpenMenuIndex$(this._menuTriggers$);

		this._keyManager = new FocusKeyManager(this._menuItems!)
			.withHorizontalOrientation("ltr")
			.withWrap(true);

		let focusOrigin$ = this._focusMonitor.monitor(this._elementRef, true);

		// Pipe <-/-> keypresses to the FocusKeyManager
		this._keyPresses$.pipe(
			withLatestFrom(focusOrigin$),
			filter(([, origin]) => origin !== null),
			map(([event]) => event),
			takeUntil(this._onDestroy$),
		).subscribe(event => {
			this._keyManager!.setFocusOrigin("keyboard");
			this._keyManager!.onKeydown(event);
		});

		// Switch the open menu when mousing over menu items while a menu is open
		this._menuItems$.pipe(
			switchMap(items =>
				merge(...items.map(({ elementRef }, idx) =>
					fromEvent(elementRef.nativeElement, "mouseenter")
						.pipe(map(() => idx))
				))
			),
			withLatestFrom(this._openMenuIndex$!),
			filter(([hovIdx, openIdx]) => openIdx !== -1 && hovIdx !== openIdx),
			map(([idx]) => idx),
			takeUntil(this._onDestroy$),
		).subscribe(idx => {
			this.openMenu(idx, "mouse");
		});

		// Switch the open menu when pressing <-/-> while a menu is open
		this._keyPresses$.pipe(
			map(event => /Right$/.test(event.key) ? 1 : -1),
			withLatestFrom(this._openMenuIndex$),
			filter(([, openIdx]) => openIdx !== -1),
		).subscribe(([delta, openIdx]) => {
			let len = this._menuTriggers!.length;
			let idx = openIdx + delta;

			if (idx >= len) idx = 0;
			else if (idx < 0) idx = len - 1;

			this.openMenu(idx, "keyboard");
		});
	}

	ngOnDestroy(): void {
		this._onDestroy$.next();
		this._onDestroy$.complete();
		this._focusMonitor.stopMonitoring(this._elementRef);
	}

	@HostListener("focus")
	onFocus(): void {
		this._keyManager!.setFocusOrigin("keyboard");
		this._keyManager!.setFirstItemActive();
	}

	private openMenu(menuIdx: number, focusOrigin: FocusOrigin): void {
		let trigger = this._menuTriggers!.toArray()[menuIdx];
		trigger?.initialize?.();
		setTimeout(() => {
			trigger?.overlay.open(trigger.menu.template!, focusOrigin)
		});
	}

	private initOpenMenuIndex$(
		triggers: Observable<QueryList<MenuTrigger>>,
	): Observable<number> {
		return triggers.pipe(
			switchMap(triggers => {
				let events$ = triggers.map(trigger => trigger.overlay.events$.pipe(
					startWith({ isOpen: false }),
					map(event => event.isOpen),
				));
				return combineLatest([...events$]);
			}),
			map(isOpens => isOpens.findIndex(isOpen => isOpen)),
			distinctUntilChanged(),
			tap(idx => this._menuItems!.forEach((item, i) => {
				let { classList } = item.elementRef.nativeElement;
				if (i === idx) {
					classList.add("active");
				} else if (classList.contains("active")) {
					classList.remove("active");
				}
			})),
			shareReplay(),
			takeUntil(this._onDestroy$),
		);
	}
}
