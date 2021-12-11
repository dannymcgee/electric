import {
	Component,
	ViewEncapsulation,
	ChangeDetectionStrategy,
	TemplateRef,
	Input,
	HostBinding,
	HostListener,
	Output,
	EventEmitter,
	ElementRef,
	ViewChildren,
	Pipe,
	PipeTransform,
} from "@angular/core";

import { DetectChanges, QueryList } from "@electric/ng-utils";

import { OPTION } from "../select.types";
import { OverlayData } from "../select-overlay-data.service";

@Component({
	selector: "elx-option-list",
	template: `
		<ng-container
			*ngIf="template != null"
			[ngTemplateOutlet]="template"
		></ng-container>

		<ng-container
			*ngIf="_overlayData as data"
		>
			<div class="elx-option-list__lens"
				*elxUnwrap="(data.activeIndex$ | async) as idx"
				[attr.data-active-index]="idx"
				[attr.data-option-height]="data.optionHeight"
				[style.height]="data.optionHeight + 'px'"
				[style.transform]="idx | lensXform : data.optionHeight"
			></div>
		</ng-container>
	`,
	styleUrls: ["./option-list.component.scss"],
	encapsulation: ViewEncapsulation.None,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OptionListComponent {
	@HostBinding("class")
	readonly hostClass = "elx-option-list";

	@HostBinding("attr.id")
	@DetectChanges()
	@Input() id?: string;

	@DetectChanges()
	@Input() template?: TemplateRef<void>;

	@Output() close = new EventEmitter<void>();

	@ViewChildren(OPTION, { read: ElementRef })
	_options?: QueryList<ElementRef<HTMLElement>>;

	constructor (
		public _overlayData: OverlayData,
	) {}

	@HostListener("window:click")
	_close(): void {
		this.close.emit();
	}
}

@Pipe({
	name: "lensXform",
	pure: true,
})
export class OptionListLensTransformPipe implements PipeTransform {
	transform(activeIndex: number, optionHeight: number) {
		let offset = activeIndex * optionHeight;
		if (activeIndex > -1) {
			offset += 8;
		}
		return `translate3d(0px, ${offset}px, 0px)`;
	}
}
