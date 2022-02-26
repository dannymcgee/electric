import { DataSource } from "@angular/cdk/collections";
import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Debounce } from "@electric/ng-utils";
import { Entry } from "@tidy-api";

import { BehaviorSubject, map, Observable } from "rxjs";

type Column = keyof Entry;

export enum Sort {
	Asc = 1,
	Desc = -1,
}

@Injectable()
export class ExplorerDataSource implements DataSource<Entry> {
	private _data$ = new BehaviorSubject<Entry[]>([]);

	private _sortBy: Column = "basename";
	get sortBy() { return this._sortBy; }
	set sortBy(value) {
		this._sortBy = value;
		this.reSort();
	}

	private _sortDirection = Sort.Asc;
	get sortDirection() { return this._sortDirection; }
	set sortDirection(value) {
		this._sortDirection = value;
		this.reSort();
	}

	constructor (
		private _http: HttpClient,
	) {}

	open(dir: string): void {
		this._http
			.post<Entry[]>("/api", { dir })
			.pipe(map(this.sort))
			.subscribe(entries => this._data$.next(entries));
	}

	connect(): Observable<readonly Entry[]> {
		return this._data$;
	}

	disconnect(): void {}

	@Debounce(33.333)
	private reSort(): void {
		this._data$.next(this.sort(this._data$.value));
	}

	private sort = (entries: readonly Entry[]) => {
		return entries.slice().sort((a, b) => {
			if (a.type !== "folder" && b.type === "folder")
				return this._sortDirection;
			if (a.type === "folder" && b.type !== "folder")
				return -this._sortDirection;

			switch (this._sortBy) {
				case "basename":
				case "path": {
					return a.basename.localeCompare(b.basename) * this._sortDirection;
				}
				case "size":
				case "created":
				case "lastAccessed":
				case "lastModified":
				case "lastChanged": {
					return (a[this._sortBy] - b[this._sortBy]) * this._sortDirection;
				}
				case "hidden": {
					if (!a.hidden && b.hidden)
						return this._sortDirection;
					if (a.hidden && !b.hidden)
						return -this._sortDirection;
					return 0;
				}
				default:
					return 0;
			}
		});
	}
}
