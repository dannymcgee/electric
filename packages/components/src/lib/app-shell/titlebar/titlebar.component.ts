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
} from "@angular/core";

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

	@Input() title?: string;
	@Input() maximized = false;

	@Output() maximizedChange = new EventEmitter<boolean>();
	@Output() minimize = new EventEmitter<void>();
	@Output() close = new EventEmitter<void>();

	@ContentChild(forwardRef(() => TitlebarIconDirective))
	_icon?: TitlebarIconDirective;
}

@Directive({
	selector: "[elxTitlebarIcon]",
})
export class TitlebarIconDirective {
	constructor (
		public templateRef: TemplateRef<void>,
	) {}
}
