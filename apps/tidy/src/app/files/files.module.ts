import { CdkTableModule } from "@angular/cdk/table";
import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { IconModule } from "@electric/components/icon";

import { FileExplorer } from "./explorer/file-explorer.component";
import { FileIcon } from "./icon/file-icon.component";
import { FileSizePipe } from "./file-size.pipe";
import { FileTypePipe } from "./file-type.pipe";
import { SortHeaderComponent, SortIconPipe } from "./explorer/sort-header.component";

@NgModule({
	imports: [
		CdkTableModule,
		IconModule,
		CommonModule,
	],
	declarations: [
		FileIcon,
		FileSizePipe,
		FileTypePipe,
		FileExplorer,
		SortHeaderComponent,
		SortIconPipe,
	],
	exports: [
		FileIcon,
		FileSizePipe,
		FileTypePipe,
		FileExplorer,
	],
})
export class FilesModule {}
