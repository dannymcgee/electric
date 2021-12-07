import {
	Component,
	ViewEncapsulation,
	ChangeDetectionStrategy,
	Input,
	Output,
	EventEmitter,
	HostBinding,
	Directive,
	TemplateRef,
	ContentChild,
	forwardRef,
	Optional,
	Inject,
} from "@angular/core";

import { APP_PLATFORM, AppPlatform } from "@electric/platform";

@Component({
	selector: "elx-titlebar",
	templateUrl: "./titlebar.component.html",
	styleUrls: ["./titlebar.component.scss"],
	encapsulation: ViewEncapsulation.None,
	changeDetection: ChangeDetectionStrategy.OnPush,
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
	@Output() close = new EventEmitter<void>();

	@ContentChild(forwardRef(() => TitlebarIconDirective))
	_icon?: TitlebarIconDirective;

	constructor (
		@Optional() @Inject(APP_PLATFORM)
			private _platform: AppPlatform,
	) {}
}

@Directive({
	selector: "[elxTitlebarIcon]",
})
export class TitlebarIconDirective {
	constructor (
		public templateRef: TemplateRef<void>,
	) {}
}
