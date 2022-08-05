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
<a class="link" [href]="href">
	<ng-content></ng-content>
</a>

<r-nav-point *ngFor="let child of children"
	[depth]="depth + 1"
	[href]="child.href"
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

	@Input() href!: string;
	@Input() depth = 1;
	@Input() children: NavPoint[] = [];
}
