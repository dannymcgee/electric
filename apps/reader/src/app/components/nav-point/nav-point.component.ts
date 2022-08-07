import {
	Component,
	ChangeDetectionStrategy,
	HostBinding,
	Input,
} from "@angular/core";

import { NavPoint } from "../book-reader/book-reader.service";

@Component({
	selector: "r-nav-point",
	template: `

<a class="link"
	[class.active]="active"
	[href]="href"
>
	<span class="link__content">
		<ng-content></ng-content>
	</span>
</a>

<r-nav-point *ngFor="let child of children"
	[depth]="depth + 1"
	[href]="child.href"
	[activeId]="activeId"
	[children]="child.children"
>
	{{ child.label }}
</r-nav-point>

  `,
	styleUrls: ["./nav-point.component.scss"],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavPointComponent {
	@HostBinding("attr.role")
	readonly role = "listitem";

	@HostBinding("style.--depth")
	@Input() depth = 1;

	@Input() href!: string;
	@Input() children: NavPoint[] = [];

	@Input()
	get activeId() { return this._activeId; }
	set activeId(value) {
		this._activeId = value;
		this.active = !!value && this.href === `#${value}`;
	}
	private _activeId?: string;

	active = false;
}
