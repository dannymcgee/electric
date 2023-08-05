import {
	Component,
	ViewEncapsulation,
	ChangeDetectionStrategy,
	HostBinding,
	ContentChildren,
	AfterContentInit,
	OnDestroy,
	Input,
	ElementRef,
	ChangeDetectorRef,
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
	template: `

<ng-content></ng-content>

<div *ngIf="animated else staticPanel"
	class="elx-tab-group__panels"
	[style.width.%]="(_tabPanels?.length ?? 0) * 100"
	[style.left.%]="((_activeIndex$ | async) ?? 0) * -100"
>
	<div *ngFor="let panel of _tabPanels"
		class="elx-tab-group__panel"
		[class.active]="panel.tab === (_activeTab$ | async)"
		[style.padding]="_computedStyle.padding"
		role="tabpanel"
		[attr.id]="panel.id"
		[attr.aria-labelledby]="panel.tab?.id"
	>
		<ng-template
			[ngTemplateOutlet]="panel._template"
		></ng-template>
	</div>
</div>

<ng-template #staticPanel>
	<div class="elx-tab-group__panel">
		<ng-template
			[ngTemplateOutlet]="(_activePanel$ | async)?._template ?? null"
		></ng-template>
	</div>
</ng-template>

	`,
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

	_activePanel$?: Observable<TabPanelDirective>;

	@ContentChildren(TabPanelDirective)
	_tabPanels?: QueryList<TabPanelDirective>;

	_computedStyle: CSSStyleDeclaration;
	_activeIndex$ = new ReplaySubject<number>();
	_activeTab$ = new ReplaySubject<Tab>();

	private _onDestroy$ = new Subject<void>();

	constructor (
		private _changeDetector: ChangeDetectorRef,
		private _elementRef: ElementRef<HTMLElement>,
	) {
		this._computedStyle = getComputedStyle(this._elementRef.nativeElement);
	}

	ngAfterContentInit(): void {
		assert(this.tabList?._activeTab$ != null);
		assert(this.tabList?._activeIndex$ != null);

		this.tabList._activeIndex$.pipe(
			shareReplay({ refCount: true }),
			takeUntil(this._onDestroy$),
		).subscribe(idx => {
			this._activeIndex$.next(idx);
		});

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
		this._activeIndex$.complete();
		this._activeTab$.complete();
		this._onDestroy$.next();
		this._onDestroy$.complete();
	}
}
