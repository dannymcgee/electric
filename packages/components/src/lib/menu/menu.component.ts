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

import { MENU, MENU_ITEM, Menu, MenuItem } from "./menu.types";

@Component({
	selector: "elx-menu",
	templateUrl: "./menu.component.html",
	styleUrls: ["./menu.component.scss"],
	providers: [{
		provide: MENU,
		useExisting: MenuComponent,
	}],
	changeDetection: ChangeDetectionStrategy.OnPush,
	exportAs: "menu",
})
export class MenuComponent implements Menu {
	@Input("class")
	panelClass?: string;

	@ViewChild(TemplateRef)
	readonly template?: TemplateRef<void>;

	@ContentChildren(MENU_ITEM)
	items!: QueryList<MenuItem>;

	get encapsulationId() {
		return findEncapsulationId(this._elementRef);
	}

	constructor (
		private _elementRef: ElementRef<HTMLElement>,
	) {}
}
