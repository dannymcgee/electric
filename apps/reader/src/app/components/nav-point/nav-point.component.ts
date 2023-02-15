import {
	Component,
	ChangeDetectionStrategy,
	HostBinding,
	Input,
	Output,
	EventEmitter,
} from "@angular/core";
import { match } from "@electric/utils";

import { NavPoint } from "../book-reader/book-reader.service";

@Component({
	selector: "r-nav-point",
	template: `

<div class="entry" role="presentation">
	<elx-icon class="entry__tree-toggle"
		*ngIf="expandable"
		[style.transform]="'rotate(' + (expanded ? '90' : '0') + 'deg)'"
		icon="ChevronRightSmall"
		size="sm"
		(click)="expanded = !expanded"
	></elx-icon>

	<a class="entry__link entry__{{ linkLevelClass }}"
		[class.active]="active"
		[href]="href"
	>
		<span class="entry__link__content">
			<ng-content></ng-content>
		</span>
	</a>
</div>

<div *ngIf="children.length"
	class="children"
	[class.children--expandable]="expandable"
	[style.height]="expandable && !expanded ? 0 : 'auto'"
	[style.padding-bottom.px]="expandable && expanded ? 4 : 0"
>
	<r-nav-point *ngFor="let child of children"
		[depth]="depth + 1"
		[href]="child.href"
		[activeId]="activeId"
		[children]="child.children"
		(activeChange)="onChildActiveChange($event)"
	>
		{{ child.label }}
	</r-nav-point>
</div>

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

		const isActive = !!value && this.href === `#${value}`;
		if (isActive !== this.active) {
			// Defer affirmative activation changes until next tick
			// to avoid a race condition
			if (isActive) {
				setTimeout(() => this.activeChange.emit(isActive));
			} else {
				this.activeChange.emit(isActive);
			}

			this.active = isActive;
		}
	}
	private _activeId?: string;

	@Output() activeChange = new EventEmitter<boolean>();

	get linkLevelClass() {
		return match(this.depth, {
			1: () => "link--primary",
			2: () => "link--secondary",
			_: () => this.children.length
				? "link--secondary"
				: "link--tertiary",
		});
	}

	get expandable() {
		return this.depth >= 2 && this.children.length;
	}

	expanded = false;
	active = false;

	onChildActiveChange(isActive: boolean): void {
		if (isActive && this.expandable && !this.expanded) {
			this.expanded = true;
		}
		this.activeChange.emit(isActive);
	}
}
