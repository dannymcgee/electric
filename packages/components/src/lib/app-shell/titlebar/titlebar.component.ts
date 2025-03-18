import {
	ChangeDetectionStrategy,
	Component,
	ContentChild,
	Directive,
	EventEmitter,
	forwardRef,
	HostBinding,
	inject,
	Input,
	Output,
	ViewEncapsulation,
} from "@angular/core";
import { injectTemplate } from "@electric/ng-utils";

import { APP_PLATFORM, AppPlatform } from "@electric/platform";

@Component({
	selector: "elx-titlebar",
	template: `

@if (_icon != null) {
	<div class="elx-titlebar__icon">
		<ng-template [ngTemplateOutlet]="_icon!.templateRef" />
	</div>
}

<ng-content select="elx-menubar" />

@if (title != null) {
	<div class="elx-titlebar__title">{{ title }}</div>
} @else {
	<ng-content select="[elxTitlebarTitle]" />
}

<ng-content />

<div class="elx-window-controls">
	<div class="elx-window-controls__button"
		(click)="minimize.emit()"
	>
		<elx-icon icon="WindowsMinimize" />
	</div>
	<div class="elx-window-controls__button"
		(click)="maximizedChange.emit(!maximized)"
	>
		<elx-icon
			[icon]="maximized ? 'WindowsRestore' : 'WindowsMaximize'"
		/>
	</div>
	<div
		class="elx-window-controls__button
		       elx-window-controls__button--close"
		(click)="close.emit()"
	>
		<elx-icon icon="WindowsClose" />
	</div>
</div>

`,
	styleUrls: ["./titlebar.component.scss"],
	encapsulation: ViewEncapsulation.None,
	changeDetection: ChangeDetectionStrategy.OnPush,
	standalone: false,
})
export class TitlebarComponent {
	@HostBinding("class")
	readonly hostClass = "elx-titlebar";

	@HostBinding("attr.role")
	readonly role = "banner";

	@HostBinding("attr.title")
	readonly _titleFix = null;

	@HostBinding("attr.data-tauri-drag-region")
	get tauriDragRegion() {
		return this._platform === AppPlatform.Tauri ? "" : null;
	}

	@HostBinding("style.-webkit-app-region")
	get webkitAppRegion() {
		return this._platform === AppPlatform.Electron ? "drag" : null;
	}

	@Input() title?: string;
	@Input() maximized = false;

	@Output() maximizedChange = new EventEmitter<boolean>();
	@Output() minimize = new EventEmitter<void>();
	// eslint-disable-next-line @angular-eslint/no-output-native
	@Output() close = new EventEmitter<void>();

	@ContentChild(forwardRef(() => TitlebarIconDirective))
	_icon?: TitlebarIconDirective;

	private _platform = inject(APP_PLATFORM, { optional: true });
}

@Directive({
	selector: "[elxTitlebarIcon]",
	standalone: false,
})
export class TitlebarIconDirective {
	templateRef = injectTemplate<void>();
}
