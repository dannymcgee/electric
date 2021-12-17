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
	delay,
	merge,
	ReplaySubject,
	shareReplay,
	skip,
	Subject,
	take,
	takeUntil,
} from "rxjs";

import { QueryList } from "@electric/ng-utils";
import { anim } from "@electric/style";
import { assert } from "@electric/utils";

import { TabListComponent } from "../tab-list/tab-list.component";
import { TabPanelDirective } from "../tab-panel.directive";
import { Tab } from "../tabs.types";

@Component({
	selector: "elx-tab-group",
	template: `

<ng-content></ng-content>

<div class="elx-tab-group__panels"
	[style.width.%]="(_tabPanels?.length ?? 0) * 100"
	[style.left.%]="((_activeIndex$ | async) ?? 0) * -100"
>
	<div *ngFor="let panel of _tabPanels"
		class="elx-tab-group__panel"
		[class.active]="panel._tab === (_activeTab$ | async)"
		[style.padding]="_computedStyle.padding"
		role="tabpanel"
		[attr.id]="panel.id"
		[attr.aria-labelledby]="panel._tab?.id"
	>
		<ng-template
			[ngTemplateOutlet]="panel._template"
		></ng-template>
	</div>
</div>

	`,
	styleUrls: ["./tab-group.component.scss"],
	encapsulation: ViewEncapsulation.None,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabGroupComponent implements AfterContentInit, OnDestroy {
	@HostBinding("class")
	readonly hostClass = "elx-tab-group";

	@Input("for") tabList?: TabListComponent;

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
