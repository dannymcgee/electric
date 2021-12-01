import {
	Component,
	ViewEncapsulation,
	ChangeDetectionStrategy,
	HostBinding,
	Directive,
	TemplateRef,
	Optional,
	SkipSelf,
	ChangeDetectorRef,
	Host,
	HostListener,
} from "@angular/core";
import { CdkAccordion, CdkAccordionItem } from "@angular/cdk/accordion";
import { UniqueSelectionDispatcher } from "@angular/cdk/collections";

import { ACCORDION_TRIGGER, BLOCK_FIRST_ENTER_ANIM } from "./accordion.animation";

@Directive({
	selector: "ng-template[elxAccordionContent]",
})
export class AccordionContentDirective {
	@HostBinding("class")
	readonly hostClass = "elx-accordion-content";

	constructor (
		public _template: TemplateRef<void>,
	) {}
}

@Directive({
	selector: "[elxAccordionToolbar]",
})
export class AccordionToolbarDirective {
	@HostBinding("class")
	readonly hostClass = "elx-accordion-header__toolbar";

	@HostListener("click", ["$event"])
	_preventBubbling(event: Event): void {
		event.stopPropagation();
	}
}

@Component({
	selector: "elx-accordion-header, [elx-accordion-header]",
	template: `
		<span class="elx-accordion-header__title">
			<ng-content></ng-content>
		</span>
		<ng-content select="[elxAccordionToolbar]"></ng-content>
		<div class="elx-accordion-header__icon"
			[class.elx-accordion-header__icon--expanded]="accordion.expanded"
		>
			<elx-icon icon="ChevronRightSmall"></elx-icon>
		</div>
	`
})
export class AccordionHeaderComponent {
	@HostBinding("class")
	readonly hostClass = "elx-accordion-header";

	constructor (
		@Host() public accordion: AccordionComponent,
	) {}

	@HostListener("click")
	_toggle(): void {
		this.accordion.toggle();
	}
}

@Component({
	selector: "elx-accordion-group, [elx-accordion-group]",
	template: `<ng-content></ng-content>`,
	styleUrls: ["./accordion-group.component.scss"],
	encapsulation: ViewEncapsulation.None,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccordionGroupComponent extends CdkAccordion {
	@HostBinding("class")
	readonly hostClass = "elx-accordion-group"
}

@Component({
	selector: "elx-accordion, [elx-accordion]",
	template: `
		<ng-content
			select="elx-accordion-header, [elx-accordion-header]"
		></ng-content>
		<section class="elx-accordion-body"
			*ngIf="expanded"
			@accordion
		>
			<ng-content></ng-content>
		</section>
	`,
	styleUrls: ["./accordion.component.scss"],
	animations: [ACCORDION_TRIGGER, BLOCK_FIRST_ENTER_ANIM],
	encapsulation: ViewEncapsulation.None,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccordionComponent extends CdkAccordionItem {
	@HostBinding("class")
	readonly hostClass = "elx-accordion";

	@HostBinding("@blockFirstEnterAnim")
	readonly blockFirstEnterAnim = true;

	constructor (
		@Optional() @SkipSelf()
			public accordionGroup: CdkAccordion,
		changeDetector: ChangeDetectorRef,
		dispatcher: UniqueSelectionDispatcher,
	) {
		super(accordionGroup, changeDetector, dispatcher);
	}
}
