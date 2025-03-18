import { FocusKeyManager, FocusMonitor } from "@angular/cdk/a11y";
import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ContentChildren,
	EventEmitter,
	HostBinding,
	inject,
	Input,
	OnDestroy,
	OnInit,
	Output,
	ViewEncapsulation,
} from "@angular/core";
import {
	animationFrameScheduler,
	BehaviorSubject,
	combineLatest,
	debounceTime,
	distinctUntilChanged,
	distinctUntilKeyChanged,
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
} from "rxjs";

import { Coerce, DetectChanges, injectRef, QueryList } from "@electric/ng-utils";
import { assert, exists, fromKeydown } from "@electric/utils";

import { IndicatorPosition, Tab, TAB } from "../tabs.types";

@Component({
	selector: "elx-tab-list",
	templateUrl: "./tab-list.component.html",
	styleUrls: ["./tab-list.component.scss"],
	encapsulation: ViewEncapsulation.None,
	changeDetection: ChangeDetectionStrategy.OnPush,
	exportAs: "tablist",
	standalone: false,
})
export class TabListComponent implements OnInit, AfterContentInit, OnDestroy {
	@HostBinding("class")
	get hostClasses() {
		return {
			"elx-tab-list": true,
			"indicator-bottom": this.indicator === "bottom",
			"indicator-top": this.indicator === "top",
		};
	}

	@HostBinding("attr.role")
	readonly role = "tablist";

	@HostBinding("tabIndex")
	_tabIndex = 0;

	@HostBinding("class.underlined")
	@Coerce(Boolean)
	@Input() underlined = false;

	@HostBinding("class.animated")
	@Coerce(Boolean)
	@Input() animated = false;

	@Input() indicator: IndicatorPosition = "bottom";

	@HostBinding("class.active-hover")
	@DetectChanges()
	_activeHover = false;

	@HostBinding("class.focus-visible")
	@DetectChanges()
	_keyboardFocus = false;

	@Input()
	get activeIndex() { return this._activeIndex$.value; }
	set activeIndex(idx) {
		this._activeIndex$.next(idx);
		this._keyManager?.setActiveItem(idx);
	}
	@Output() activeIndexChange = new EventEmitter<number>();

	get activeIndex$() { return this._activeIndex$.asObservable(); }
	private _activeIndex$ = new BehaviorSubject<number>(-1);

	_activeTab$?: Observable<Tab>;
	_activeTabWidth$?: Observable<number>;
	_activeTabOffset$?: Observable<number>;

	@ContentChildren(TAB, { descendants: true })
	_tabs?: QueryList<Tab>;
	_tabs$?: Observable<QueryList<Tab>>;

	private _onDestroy$ = new Subject<void>();
	private _keyManager?: FocusKeyManager<Tab>;

	private _cdRef = inject(ChangeDetectorRef);
	get changeDetector() { return this._cdRef; }

	private _parentChangeDetector = inject(ChangeDetectorRef, { skipSelf: true });
	private _elementRef = injectRef<HTMLElement>();
	private _focusMonitor = inject(FocusMonitor);

	ngOnInit(): void {
		let focusChanges$ = this._focusMonitor
			.monitor(this._elementRef, true)
			.pipe(
				distinctUntilChanged(),
				share(),
				takeUntil(this._onDestroy$),
			);

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

			// Prevents a changed-after-checked error
			this._parentChangeDetector.detectChanges();
		});

		// When the tablist is keyboard-focused, forward focus to the active tab.
		focusChanges$
			.pipe(filter(origin => origin === "keyboard"))
			.subscribe(() => {
				let tab = this.getActiveTab();
				if (tab) {
					this._keyManager!.setActiveItem(tab);
				}
			});

		// Pipe keydown events to the key-manager while the tabs are focused.
		focusChanges$
			.pipe(
				filter(origin => origin !== null),
				takeUntil(focusChanges$.pipe(
					filter(origin => origin === null),
				)),
				switchMap(() => fromKeydown(this._elementRef)),
				takeUntil(this._onDestroy$),
			)
			.subscribe(event => {
				this._keyManager!.setFocusOrigin("keyboard");
				this._keyManager!.onKeydown(event);
			});
	}

	ngAfterContentInit(): void {
		assert(this._tabs != null);

		// Observable from QueryList
		this._tabs$ = this._tabs.changes.pipe(
			startWith(this._tabs),
			shareReplay({ refCount: true }),
			takeUntil(this._onDestroy$),
		);

		// Create an observable of the current tablist + the active index,
		// which only emits once both the tablist and the index are up to date.
		// The filter is necessary when the tablist is dynamically populated.
		const tabsState$: Observable<[QueryList<Tab>, number]> =
			combineLatest([this._tabs$, this._activeIndex$]).pipe(
				filter(([tabs, idx]) => exists(tabs.get(idx))),
				takeUntil(this._onDestroy$),
			);

		// Track the active tab
		this._activeTab$ = tabsState$.pipe(
			map(([tabs, idx]) => tabs.get(idx)!),
			distinctUntilKeyChanged("id"),
		);

		// Keep the active tab style and `aria-selected` states up to date
		tabsState$.subscribe(([tabs, idx]) => {
			tabs.forEach((tab, i) => {
				tab.active = i === idx;
			});
			// Prevents a changed-after-checked error when the tablist is dynamic
			this._parentChangeDetector.detectChanges();
		});

		// Init key manager
		this._keyManager = new FocusKeyManager(this._tabs!)
			.withHorizontalOrientation("ltr")
			.withHomeAndEnd(true)
			.withTypeAhead()
			.withWrap(true);

		// Emit activeIndexChange when keyManager signals a change should occur
		this._keyManager.change
			.pipe(
				filter(idx => idx !== this._activeIndex$.value),
				takeUntil(this._onDestroy$),
			)
			.subscribe(idx => this.activeIndexChange.emit(idx));

		// Emit activeIndexChange when a tab is clicked
		this._tabs$.pipe(
			switchMap(tabs =>
				merge(...tabs.map((tab, idx) =>
					tab.select.pipe(mapTo(idx))
				))
			),
			takeUntil(this._onDestroy$),
		).subscribe(idx => {
			this.activeIndexChange.emit(idx);
		});

		// Track the index of the currently hovered tab (-1 if none)
		let hoveredIdx$ = this._tabs$.pipe(
			switchMap(tabs =>
				merge(...tabs.map((tab, idx) =>
					tab.hoverChanges$.pipe(map(hovered => hovered ? idx : -1))
				))
			),
			debounceTime(0, animationFrameScheduler),
			takeUntil(this._onDestroy$),
		);

		// Toggle a class on the host element when the active tab is hovered
		// (activates an animation on the active-indicator)
		combineLatest([hoveredIdx$, this._activeIndex$])
			.pipe(takeUntil(this._onDestroy$))
			.subscribe(([hovIdx, activeIdx]) => {
				this._activeHover = hovIdx === activeIdx;
			});

		// Track the width of the currently active tab
		// (controls the width of the animated indicator)
		this._activeTabWidth$ = this._activeTab$.pipe(
			switchMap(tab => tab.width$),
			takeUntil(this._onDestroy$),
		);

		// Track the left offset of the currently active tab
		// (controls the position of the animated indicator)
		this._activeTabOffset$ = tabsState$.pipe(
				switchMap(([tabs, idx]) => {
					let widths$ = tabs
						.toArray()
						.slice(0, idx)
						.map(tab => tab.width$);

					if (!widths$.length) return of([0]);

					return combineLatest(widths$);
				}),
				map(widths => widths.reduce((acc, cur) => acc + cur)),
				distinctUntilChanged(),
				takeUntil(this._onDestroy$),
			);
	}

	ngOnDestroy(): void {
		this._focusMonitor.stopMonitoring(this._elementRef);
		this._activeIndex$.complete();
		this._onDestroy$.next();
		this._onDestroy$.complete();
	}

	private getActiveTab(): Tab | undefined {
		return this._tabs?.find(tab => tab.active);
	}
}
