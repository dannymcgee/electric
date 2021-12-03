import {
	Component,
	ChangeDetectionStrategy,
	Input,
	ViewChild,
	TemplateRef,
	ContentChildren,
	QueryList,
	ElementRef,
} from "@angular/core";
import { findEncapsulationId } from "@electric/ng-utils";

import { MenuItemComponent } from "./menu-item/menu-item.component";

@Component({
	selector: "elx-menu",
	templateUrl: "./menu.component.html",
	styleUrls: ["./menu.component.scss"],
	changeDetection: ChangeDetectionStrategy.OnPush,
	exportAs: "menu",
})
export class MenuComponent {
	@Input("class")
	panelClass?: string;

	@ViewChild(TemplateRef)
	readonly template?: TemplateRef<void>;

	@ContentChildren(MenuItemComponent)
	items!: QueryList<MenuItemComponent>;

	get encapsulationId() {
		return findEncapsulationId(this._elementRef);
	}

	constructor (
		private _elementRef: ElementRef<HTMLElement>,
	) {}
}
