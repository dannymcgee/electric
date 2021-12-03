import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";

import { IconModule } from "@electric/components/icon";

import { MenuComponent } from "./menu.component";
import { MenuItemComponent } from "./menu-item/menu-item.component";
import { MenuPanelComponent } from "./menu-panel/menu-panel.component";
import { MenubarComponent } from "./menubar/menubar.component";
import {
	ContextMenuTriggerDirective,
	MenuTriggerDirective,
	SubmenuTriggerDirective,
} from "./menu.directive";

@NgModule({
	imports: [
		CommonModule,
		IconModule,
	],
	declarations: [
		MenuComponent,
		MenuItemComponent,
		MenuPanelComponent,
		MenubarComponent,
		MenuTriggerDirective,
		ContextMenuTriggerDirective,
		SubmenuTriggerDirective,
	],
	exports: [
		MenuComponent,
		MenuItemComponent,
		MenubarComponent,
		MenuTriggerDirective,
		ContextMenuTriggerDirective,
		SubmenuTriggerDirective,
	],
})
export class MenuModule {}
