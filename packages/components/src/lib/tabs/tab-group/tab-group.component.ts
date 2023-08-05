import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ContentChildren,
	ElementRef,
	HostBinding,
	Input,
	OnDestroy,
	TrackByFunction,
	ViewEncapsulation,
} from "@angular/core";
import {
	combineLatest,
	delay,
	map,
	merge,
	Observable,
	ReplaySubject,
	shareReplay,
	skip,
	startWith,
	Subject,
	take,
	takeUntil,
} from "rxjs";

import { Coerce, QueryList } from "@electric/ng-utils";
import { anim } from "@electric/style";
import { assert } from "@electric/utils";

import { TabListComponent } from "../tab-list/tab-list.component";
import { TabPanelDirective } from "../tab-panel.directive";
import { Tab } from "../tabs.types";

@Component({
	selector: "elx-tab-group",
	templateUrl: "./tab-group.component.html",
	styleUrls: ["./tab-group.component.scss"],
	encapsulation: ViewEncapsulation.None,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabGroupComponent implements AfterContentInit, OnDestroy {
	@HostBinding("class")
	readonly hostClass = "elx-tab-group";

	@Input("for") tabList?: TabListComponent;

	@Coerce(Boolean)
	@Input() animated = false;

	@Coerce(Boolean)
	@Input() persistent = false;

	_activePanel$?: Observable<TabPanelDirective>;

	@ContentChildren(TabPanelDirective)
	_tabPanels?: QueryList<TabPanelDirective>;

	_computedStyle: CSSStyleDeclaration;
	_activeIndex$?: Observable<number>;
	_activeTab$ = new ReplaySubject<Tab>();

	trackById: TrackByFunction<Tab> = (_, tab) => tab.id;

	private _onDestroy$ = new Subject<void>();

	constructor (
		private _changeDetector: ChangeDetectorRef,
		private _elementRef: ElementRef<HTMLElement>,
	) {
		this._computedStyle = getComputedStyle(this._elementRef.nativeElement);
	}

	ngAfterContentInit(): void {
		assert(this.tabList?._activeTab$ != null);
		assert(this.tabList?.activeIndex$ != null);

		this._activeIndex$ = this.tabList.activeIndex$.pipe(
			shareReplay({ refCount: true }),
			takeUntil(this._onDestroy$),
		);

		const tabPanels$ = this._tabPanels!.changes.pipe(
			startWith(this._tabPanels!),
			takeUntil(this._onDestroy$),
		);

		this._activePanel$ = combineLatest([tabPanels$, this._activeIndex$]).pipe(
			map(([panels, idx]) => panels.get(idx)!),
			takeUntil(this._onDestroy$),
		);

		let activeTab$ = this.tabList._activeTab$.pipe(
			shareReplay({ refCount: true }),
		);

		// TODO: I cannot remember why I did this D:
		//       Comments are good, y'all
		let initialTab$ = activeTab$.pipe(take(1));
		let delayedTabs$ = activeTab$.pipe(
			skip(1),
			delay(anim.frameTime(10)),
		);

		merge(initialTab$, delayedTabs$)
			.pipe(takeUntil(this._onDestroy$))
			.subscribe(tab => {
				this._activeTab$.next(tab);
				this._changeDetector.markForCheck();
			});
	}

	ngOnDestroy(): void {
		this._activeTab$.complete();
		this._onDestroy$.next();
		this._onDestroy$.complete();
	}
}
