import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";

import { UtilityModule } from "@electric/ng-utils";

import { TabComponent } from "./tab/tab.component";
import { TabGroupComponent } from "./tab-group/tab-group.component";
import { TabListComponent } from "./tab-list/tab-list.component";
import { TabPanelDirective } from "./tab-panel.directive";

// FIXME: This module is ill-suited for dynamic tabs that can be added/removed
// or moved around at runtime. Figure out a way to separate the behavior from
// the visual features, and make the behavior a lot more reliable.

@NgModule({
	imports: [
		CommonModule,
		UtilityModule,
	],
	declarations: [
		TabComponent,
		TabGroupComponent,
		TabListComponent,
		TabPanelDirective,
	],
	exports: [
		TabComponent,
		TabGroupComponent,
		TabListComponent,
		TabPanelDirective,
	],
})
export class TabsModule {}
