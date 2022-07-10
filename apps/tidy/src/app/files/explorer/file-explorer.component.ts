import {
	Component,
	ChangeDetectionStrategy,
	Input,
	Output,
	EventEmitter,
} from "@angular/core";
import { Entry } from "@tidy-api";

import { ExplorerDataSource } from "./file-explorer.data-source";
import { InteractionFlags } from "./table-row-interaction.directive";

type Column = keyof Entry;

@Component({
	selector: "td-file-explorer",
	template: `

<cdk-table [dataSource]="_dataSrc">
	<!-- Type -->
	<ng-container cdkColumnDef="type">
		<cdk-header-cell *cdkHeaderCellDef aria-label="Type"></cdk-header-cell>
		<cdk-cell *cdkCellDef="let entry"
			[class.selected]="_selected === entry"
			[entry]="entry"
			[(tdTableRowInteraction)]="_interactionState"
			(dblclick)="navigate(entry)"
		>
			<td-file-icon [class.hidden]="entry.hidden"
				[type]="entry | filetype"
				size="16"
			></td-file-icon>
		</cdk-cell>
	</ng-container>

	<!-- Name -->
	<ng-container cdkColumnDef="basename">
		<td-sort-header *cdkHeaderCellDef>Name</td-sort-header>
		<cdk-cell *cdkCellDef="let entry"
			[class.hidden]="entry.hidden"
			[class.symlink]="entry.type === 'symlink'"
			[class.selected]="_selected === entry"
			[entry]="entry"
			[(tdTableRowInteraction)]="_interactionState"
			(dblclick)="navigate(entry)"
		>
			{{ entry.basename }}
		</cdk-cell>
	</ng-container>

	<!-- Last Accessed -->
	<ng-container cdkColumnDef="lastAccessed">
		<td-sort-header *cdkHeaderCellDef>Last Accessed</td-sort-header>
		<cdk-cell *cdkCellDef="let entry"
			[class.hidden]="entry.hidden"
			[class.symlink]="entry.type === 'symlink'"
			[class.selected]="_selected === entry"
			[entry]="entry"
			[(tdTableRowInteraction)]="_interactionState"
			(dblclick)="navigate(entry)"
		>
			{{ entry.lastAccessed | date }}
		</cdk-cell>
	</ng-container>

	<!-- Last Modified -->
	<ng-container cdkColumnDef="lastModified">
		<td-sort-header *cdkHeaderCellDef>Last Modified</td-sort-header>
		<cdk-cell *cdkCellDef="let entry"
			[class.hidden]="entry.hidden"
			[class.symlink]="entry.type === 'symlink'"
			[class.selected]="_selected === entry"
			[entry]="entry"
			[(tdTableRowInteraction)]="_interactionState"
			(dblclick)="navigate(entry)"
		>
			{{ entry.lastModified | date }}
		</cdk-cell>
	</ng-container>

	<!-- Size -->
	<ng-container cdkColumnDef="size">
		<td-sort-header *cdkHeaderCellDef>Size</td-sort-header>
		<cdk-cell *cdkCellDef="let entry"
			[class.hidden]="entry.hidden"
			[class.symlink]="entry.type === 'symlink'"
			[class.selected]="_selected === entry"
			[entry]="entry"
			[(tdTableRowInteraction)]="_interactionState"
			(dblclick)="navigate(entry)"
		>
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

	private __interactionState?: [Entry, InteractionFlags];
	get _interactionState() { return this.__interactionState; }
	set _interactionState(value) {
		this.__interactionState = value;
		if (value) {
			let [entry, flags] = value;
			if (InteractionFlags.Pressed & flags) {
				this._selected = entry;
			}
		}
	}

	_selected?: Entry;

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

	navigate(entry: Entry): void {
		if (entry.type === "folder")
			this.pathChange.emit(entry.path);
	}
}
