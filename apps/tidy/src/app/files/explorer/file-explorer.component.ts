import {
	Component,
	ChangeDetectionStrategy,
	Input,
	Output,
	EventEmitter,
} from "@angular/core";
import { Entry } from "@tidy-api";

import { ExplorerDataSource } from "./file-explorer.data-source";

type Column = keyof Entry;

@Component({
	selector: "td-file-explorer",
	template: `

<cdk-table [dataSource]="_dataSrc">
	<!-- Type -->
	<ng-container cdkColumnDef="type">
		<cdk-header-cell *cdkHeaderCellDef aria-label="Type"></cdk-header-cell>
		<cdk-cell *cdkCellDef="let entry">
			<td-file-icon [class.hidden]="entry.hidden"
				[type]="entry | filetype"
				size="16"
			></td-file-icon>
		</cdk-cell>
	</ng-container>

	<!-- Name -->
	<ng-container cdkColumnDef="basename">
		<td-sort-header *cdkHeaderCellDef>Name</td-sort-header>
		<cdk-cell *cdkCellDef="let entry" [class.hidden]="entry.hidden">
			{{ entry.basename }}
		</cdk-cell>
	</ng-container>

	<!-- Last Accessed -->
	<ng-container cdkColumnDef="lastAccessed">
		<td-sort-header *cdkHeaderCellDef>Last Accessed</td-sort-header>
		<cdk-cell *cdkCellDef="let entry" [class.hidden]="entry.hidden">
			{{ entry.lastAccessed | date }}
		</cdk-cell>
	</ng-container>

	<!-- Last Modified -->
	<ng-container cdkColumnDef="lastModified">
		<td-sort-header *cdkHeaderCellDef>Last Modified</td-sort-header>
		<cdk-cell *cdkCellDef="let entry" [class.hidden]="entry.hidden">
			{{ entry.lastModified | date }}
		</cdk-cell>
	</ng-container>

	<!-- Size -->
	<ng-container cdkColumnDef="size">
		<td-sort-header *cdkHeaderCellDef>Size</td-sort-header>
		<cdk-cell *cdkCellDef="let entry" [class.hidden]="entry.hidden">
			{{ entry.type === 'file'
				? (entry.size | filesize)
				: '' }}
		</cdk-cell>
	</ng-container>

	<cdk-header-row *cdkHeaderRowDef="_columns"></cdk-header-row>
	<cdk-row *cdkRowDef="let row; columns: _columns"></cdk-row>
</cdk-table>

	`,
	styleUrls: ["./file-explorer.component.scss"],
	changeDetection: ChangeDetectionStrategy.OnPush,
	providers: [ExplorerDataSource],
})
export class FileExplorer {
	@Input()
	get path() { return this._path; }
	set path(value) {
		this._path = value;
		this._dataSrc.open(value);
	}
	private _path = "";

	@Output() pathChange = new EventEmitter<string>();

	_columns: Column[] = [
		"type",
		"basename",
		"lastAccessed",
		"lastModified",
		"size",
	];

	constructor (
		public _dataSrc: ExplorerDataSource,
	) {}
}
