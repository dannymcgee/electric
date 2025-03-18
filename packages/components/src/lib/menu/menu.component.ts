import {
	Component,
	ChangeDetectionStrategy,
	Input,
	ViewChild,
	TemplateRef,
	ContentChildren,
	QueryList,
} from "@angular/core";
import { findEncapsulationId, injectRef } from "@electric/ng-utils";

import { MENU, MENU_ITEM, Menu, MenuItem } from "./menu.types";

@Component({
	selector: "elx-menu",
	template: `

<ng-template>
	<ng-content />
</ng-template>

	`,
	styleUrls: ["./menu.component.scss"],
	providers: [{
		provide: MENU,
		useExisting: MenuComponent,
	}],
	changeDetection: ChangeDetectionStrategy.OnPush,
	exportAs: "menu",
	standalone: false,
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

	private _elementRef = injectRef<HTMLElement>();
}
