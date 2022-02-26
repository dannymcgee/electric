import { CdkColumnDef, CdkHeaderCell } from "@angular/cdk/table";
import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	HostListener,
	OnDestroy,
	OnInit,
	Pipe,
	PipeTransform,
} from "@angular/core";
import { IconName } from "@electric/components/icon";
import { Entry } from "@tidy-api";
import { Subject, takeUntil } from "rxjs";

import { ExplorerDataSource, Sort } from "./file-explorer.data-source";

type Column = keyof Entry;

@Pipe({
	name: "sortIcon",
})
export class SortIconPipe implements PipeTransform {
	transform(active: boolean, direction: Sort): IconName {
		if (!active) return "Sort";
		switch (direction) {
			case Sort.Asc: return "SortUp";
			case Sort.Desc: return "SortDown";
		}
	}
}

@Component({
	selector: "td-sort-header",
	template: `

<ng-content></ng-content>

<elx-icon
	class="icon"
	[class.active]="isActive"
	[icon]="isActive | sortIcon : direction"
></elx-icon>

	`,
	styleUrls: ["./sort-header.component.scss"],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SortHeaderComponent
extends CdkHeaderCell
implements OnInit, OnDestroy {
	Sort = Sort;

	get isActive() { return this._dataSrc.sortBy === this._column.name; }
	get direction() { return this._dataSrc.sortDirection; }

	private _column: CdkColumnDef;
	private _onDestroy$ = new Subject<void>();

	constructor (
		column: CdkColumnDef,
		elementRef: ElementRef,
		private _changeDetector: ChangeDetectorRef,
		private _dataSrc: ExplorerDataSource,
	) {
		super(column, elementRef);
		this._column = column;
	}

	ngOnInit(): void {
		this._dataSrc
			.connect()
			.pipe(takeUntil(this._onDestroy$))
			.subscribe(() => {
				this._changeDetector.markForCheck();
			});
	}

	ngOnDestroy(): void {
		this._onDestroy$.next();
		this._onDestroy$.complete();
	}

	@HostListener("click")
	toggleSort() {
		if (this.isActive) {
			switch (this.direction) {
				case Sort.Asc:
					this._dataSrc.sortDirection = Sort.Desc;
					break;
				case Sort.Desc:
					this._dataSrc.sortDirection = Sort.Asc;
					break;
			}
		} else {
			this._dataSrc.sortBy = this._column.name as Column;
			this._dataSrc.sortDirection = Sort.Asc;
		}
	}
}
