import { FocusKeyManager, FocusMonitor } from "@angular/cdk/a11y";
import {
	Component,
	ViewEncapsulation,
	ChangeDetectionStrategy,
	AfterContentInit,
	ContentChildren,
	HostBinding,
	OnDestroy,
	ElementRef,
	OnInit,
	ChangeDetectorRef,
	Input,
	SkipSelf,
} from "@angular/core";
import {
	animationFrameScheduler,
	combineLatest,
	debounceTime,
	distinctUntilChanged,
	filter,
	map,
	mapTo,
	merge,
	Observable,
	of,
	share,
	shareReplay,
	startWith,
	Subject,
	switchMap,
	takeUntil,
	tap,
} from "rxjs";

import { Coerce, DetectChanges, QueryList } from "@electric/ng-utils";
import { assert, fromKeydown } from "@electric/utils";

import { Tab, TAB } from "../tabs.types";

@Component({
	selector: "elx-tab-list",
	template: `

<div class="elx-tab-list__container">
	<ng-content></ng-content>
	<div class="elx-tab-list__active-indicator"
		[style.left.px]="_activeTabOffset$ | async"
		[style.width.px]="_activeTabWidth$ | async"
	></div>
</div>

	`,
	styleUrls: ["./tab-list.component.scss"],
	encapsulation: ViewEncapsulation.None,
	changeDetection: ChangeDetectionStrategy.OnPush,
	exportAs: "tab-list",
})
export class TabListComponent
implements OnInit, AfterContentInit, OnDestroy {
	@HostBinding("class")
	readonly hostClass = "elx-tab-list";

	@HostBinding("attr.role")
	readonly role = "tablist";

	@HostBinding("tabIndex")
	_tabIndex = 0;

	@HostBinding("class.elx-tab-list--underlined")
	@Coerce(Boolean)
	@Input() underlined = false;

	@HostBinding("class.active-hover")
	@DetectChanges()
	_activeHover = false;

	@HostBinding("class.focus-visible")
	@DetectChanges()
	_keyboardFocus = false;

	_activeIndex$?: Observable<number>;
	_activeTab$?: Observable<Tab>;

	_activeTabWidth$?: Observable<number>;
	_activeTabOffset$?: Observable<number>;

	@ContentChildren(TAB, { descendants: true })
	private _tabs?: QueryList<Tab>;

	private _onDestroy$ = new Subject<void>();
	private _keyManager?: FocusKeyManager<Tab>;

	constructor (
		@SkipSelf() private _parentChangeDetector: ChangeDetectorRef,
		private _elementRef: ElementRef<HTMLElement>,
		private _focusMonitor: FocusMonitor,
	) {}

	ngOnInit(): void {
		let focusChanges$ = this._focusMonitor
			.monitor(this._elementRef, true)
			.pipe(share(), takeUntil(this._onDestroy$));

		focusChanges$.subscribe(origin => {
			this._keyManager?.setFocusOrigin(origin);
			this._keyboardFocus = origin === "keyboard";

			// Make the tablist itself focusable when none of its children have
			// focus, so we can forward focus to the active tab (per the ARIA
			// specs). Make the tablist _un_focusable when one of its children is
			// focused so that Shift+Tab will correctly skip the parent tablist.
			if (origin === null) {
				this._tabIndex = 0;
			} else {
				this._tabIndex = -1;
			}
		});

		// When the tablist is keyboard-focused, forward focus to the active tab.
		focusChanges$.pipe(
			distinctUntilChanged(),
			filter(origin => origin === "keyboard"),
		).subscribe(() => {
			let tab = this.getActiveTab();
			if (tab) {
				this._keyManager!.setActiveItem(tab);
			}
		});

		// Pipe keydown events to the key-manager while the tabs are focused.
		focusChanges$.pipe(
			filter(origin => origin !== null),
			takeUntil(focusChanges$.pipe(
				filter(origin => origin === null),
			)),
			switchMap(() => fromKeydown(this._elementRef)),
			takeUntil(this._onDestroy$),
		).subscribe(event => {
			this._keyManager!.setFocusOrigin("keyboard");
			this._keyManager!.onKeydown(event);
		});
	}

	ngAfterContentInit(): void {
		assert(this._tabs != null);

		// Init key manager
		this._keyManager = new FocusKeyManager(this._tabs!)
			.withHorizontalOrientation("ltr")
			.withWrap(true);

		// Track the index of the currently active tab (-1 if none)
		this._activeIndex$ = this._keyManager.change.pipe(
			startWith(this.getActiveIndex()),
			distinctUntilChanged(),
			shareReplay({ refCount: true }),
			takeUntil(this._onDestroy$),
		);
		this._activeTab$ = this._activeIndex$.pipe(
			map(idx => this._tabs!.get(idx)!),
			shareReplay({ refCount: true }),
			takeUntil(this._onDestroy$),
		);

		// Invoke change handler when key manager signals active tab change
		this._keyManager.change
			.pipe(takeUntil(this._onDestroy$))
			.subscribe(idx => {
				this.setActive(idx);
			});

		let tabs$ = this._tabs.changes.pipe(
			startWith(this._tabs),
			shareReplay({ refCount: true }),
			takeUntil(this._onDestroy$),
		);

		// Set active tab via key manager when a tab is clicked
		tabs$.pipe(
			switchMap(tabs =>
				merge(...tabs.map((tab, idx) =>
					tab.select.pipe(mapTo(idx))
				))
			),
			takeUntil(this._onDestroy$),
		).subscribe(idx => {
			this._keyManager!.setActiveItem(idx);
		});

		// Track the index of the currently hovered tab (-1 if none)
		let hoveredIdx$ = tabs$.pipe(
			switchMap(tabs =>
				merge(...tabs.map((tab, idx) =>
					tab.hoverChanges$.pipe(
						map(hovered => hovered ? idx : -1),
					)
				))
			),
			debounceTime(0, animationFrameScheduler),
			takeUntil(this._onDestroy$),
		);

		// Toggle a class on the host element when the active tab is hovered
		// (activates an animation on the underline indicator)
		combineLatest([hoveredIdx$, this._activeIndex$])
			.pipe(takeUntil(this._onDestroy$))
			.subscribe(([hovIdx, activeIdx]) => {
				this._activeHover = hovIdx === activeIdx;
			});

		// Track the width of the currently active tab
		// (controls the width of the underline indicator)
		this._activeTabWidth$ =
			combineLatest([this._activeIndex$, tabs$]).pipe(
				switchMap(() => this.getActiveTab()?.width$ ?? of(0)),
				distinctUntilChanged(),
				tap(() => {
					requestAnimationFrame(() => {
						this._parentChangeDetector.detectChanges();
					});
				}),
				takeUntil(this._onDestroy$),
			);

		// Track the left offset of the currently active tab
		// (controls the position of the underline indicator)
		this._activeTabOffset$ =
			combineLatest([this._activeIndex$, tabs$]).pipe(
				switchMap(([idx, tabs]) => {
					let widths$ = tabs
						.toArray()
						.slice(0, idx)
						.map(tab => tab.width$);

					if (!widths$.length) return of([0]);

					return combineLatest(widths$);
				}),
				map(widths => widths.reduce((acc, cur) => acc + cur)),
				distinctUntilChanged(),
				tap(() => {
					requestAnimationFrame(() => {
						this._parentChangeDetector.detectChanges();
					});
				}),
				takeUntil(this._onDestroy$),
			);
	}

	ngOnDestroy(): void {
		this._focusMonitor.stopMonitoring(this._elementRef);
		this._onDestroy$.next();
		this._onDestroy$.complete();
	}

	private setActive(index: number): void {
		this._tabs?.forEach((tab, idx) => {
			tab.active = idx === index;
		});
	}

	private getActiveTab(): Tab | undefined {
		return this._tabs?.find(tab => tab.active);
	}

	/**
	 * NOTE: This should only be used to initialize the `_activeIndex$` property.
	 * Use the observable if you need access to this after initialization.
	 */
	private getActiveIndex(): number {
		if (!this._tabs) return -1;

		for (let i = 0; i < this._tabs.length; ++i) {
			if (this._tabs.get(i)!.active)
				return i;
		}

		return -1;
	}
}
