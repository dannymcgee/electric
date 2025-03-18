import { AnimationEvent } from "@angular/animations";
import { FocusableOption, FocusMonitor, FocusOrigin } from "@angular/cdk/a11y";
import { CdkAccordion, CdkAccordionItem } from "@angular/cdk/accordion";
import { UniqueSelectionDispatcher } from "@angular/cdk/collections";
import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ContentChild,
	ContentChildren,
	Directive,
	DoCheck,
	ElementRef,
	EventEmitter,
	forwardRef,
	Host,
	HostBinding,
	HostListener,
	Input,
	OnDestroy,
	Optional,
	Output,
	SkipSelf,
	TemplateRef,
	ViewChild,
	ViewEncapsulation,
} from "@angular/core";
import { QueryList } from "@electric/ng-utils";
import { elementId, exists, match } from "@electric/utils";
import { map, merge, startWith, Subject, switchMap, takeUntil } from "rxjs";

import {
	ACCORDION_TRIGGER,
	BLOCK_FIRST_ENTER_ANIM,
} from "./accordion.animation";


// Accordion Content
// =============================================================================

@Directive({
	selector: "ng-template[elxAccordionContent]",
	standalone: false,
})
export class AccordionContentDirective {
	@HostBinding("class")
	readonly hostClass = "elx-accordion-content";

	constructor (
		public _template: TemplateRef<void>,
	) {}
}


// Accordion Toolbar
// =============================================================================

@Directive({
	selector: "elx-accordion-toolbar, [elxAccordionToolbar]",
	standalone: false,
})
export class AccordionToolbarDirective {
	@HostBinding("class")
	readonly hostClass = "elx-accordion-header__toolbar";

	@HostListener("click", ["$event"])
	_preventBubbling(event: Event): void {
		event.stopPropagation();
	}
}


// Accordion Header
// =============================================================================

@Component({
	selector: "elx-accordion-header, [elxAccordionHeader]",
	template: `

<div class="elx-accordion-header"
	role="button"
	#button
	[id]="buttonId"
	[attr.aria-controls]="controls"
	[attr.aria-expanded]="accordion.expanded"
	(keydown)="onKeydown($event)"
	(click)="toggle()"
>
	<span class="elx-accordion-header__title">
		<ng-content />
	</span>
	<ng-content select="[elxAccordionToolbar]" />
	<div class="elx-accordion-header__icon"
		[class.elx-accordion-header__icon--expanded]="accordion.expanded"
	>
		<elx-icon icon="ChevronRightSmall" />
	</div>
</div>

	`,
	standalone: false,
})
export class AccordionHeaderComponent implements FocusableOption {
	@HostBinding("attr.role")
	readonly role = "heading";

	@HostBinding("attr.aria-level")
	@Input() level = 3;

	@Input() buttonId = elementId("accordion-button");
	@Input() controls?: string;

	@Output() up = new EventEmitter<void>();
	@Output() down = new EventEmitter<void>();
	@Output() home = new EventEmitter<void>();
	@Output() end = new EventEmitter<void>();

	@ViewChild("button", { read: ElementRef })
	private _button?: ElementRef<HTMLElement>;

	constructor (
		@Host() public accordion: AccordionComponent,
		private _focusMonitor: FocusMonitor,
	) {}

	toggle(): void {
		this.accordion.toggle();
	}

	onKeydown(event: KeyboardEvent): void {
		if (this._button && event.target === this._button.nativeElement) {
			match (event.key, {
				"ArrowUp": () => this.up.emit(),
				"ArrowDown": () => this.down.emit(),
				"Home": () => this.home.emit(),
				"End": () => this.end.emit(),
				_: () => {},
			});
		}
	}

	focus(origin?: FocusOrigin): void {
		if (this._button)
			this._focusMonitor.focusVia(this._button, origin ?? "program");
	}
}


// Accordion Group
// =============================================================================

// FIXME: `multi` input no longer working as expected?
@Component({
	selector: "elx-accordion-group, [elxAccordionGroup]",
	template: `<ng-content />`,
	styleUrls: ["./accordion-group.component.scss"],
	providers: [{
		provide: CdkAccordion,
		useExisting: AccordionGroupComponent,
	}],
	encapsulation: ViewEncapsulation.None,
	changeDetection: ChangeDetectionStrategy.OnPush,
	standalone: false,
})
export class AccordionGroupComponent
	extends CdkAccordion
	implements AfterContentInit, OnDestroy
{
	@HostBinding("class")
	readonly hostClass = "elx-accordion-group";

	@ContentChildren(forwardRef(() => AccordionComponent))
	private _accordions!: QueryList<AccordionComponent>;

	private _onDestroy$ = new Subject<void>();

	ngAfterContentInit(): void {
		const accordions$ = this._accordions.changes.pipe(
			startWith(this._accordions),
			takeUntil(this._onDestroy$),
		);

		const home$ = accordions$.pipe(
			switchMap(ql => merge(...ql.map(acc => acc._header?.home).filter(exists))),
			takeUntil(this._onDestroy$),
		);

		const end$ = accordions$.pipe(
			switchMap(ql => merge(...ql.map(acc => acc._header?.end).filter(exists))),
			takeUntil(this._onDestroy$),
		);

		const changeFocus$ = accordions$.pipe(
			switchMap(ql => merge(...ql
				.map((acc, idx) => acc._header ? [
					acc._header.up.pipe(map(() => idx - 1)),
					acc._header.down.pipe(map(() => idx + 1)),
				] : null)
				.filter(exists)
				.flat()
			)),
			takeUntil(this._onDestroy$),
		);

		home$.subscribe(() => {
			this._accordions.first._header?.focus("keyboard");
		});

		end$.subscribe(() => {
			this._accordions.last._header?.focus("keyboard");
		});

		changeFocus$.subscribe(idx => {
			while (idx < 0) idx += this._accordions.length;
			idx %= this._accordions.length;

			this._accordions.get(idx)?._header?.focus("keyboard");
		});
	}

	override ngOnDestroy(): void {
		super.ngOnDestroy();
		this._onDestroy$.next();
		this._onDestroy$.complete();
	}
}


// Accordion
// =============================================================================

@Component({
	selector: "elx-accordion, [elxAccordion]",
	template: `

<ng-content
	select="elx-accordion-header, [elxAccordionHeader]"
/>

<section class="elx-accordion-body"
	[id]="panelId"
	[hidden]="_hidden"
	[attr.aria-labelledby]="buttonId"
	[@accordion]="expanded ? 'expanded' : 'collapsed'"
	(@accordion.start)="onAnimationStart($event)"
	(@accordion.done)="onAnimationDone($event)"
>
	<ng-content />
</section>

	`,
	styleUrls: ["./accordion.component.scss"],
	providers: [{
		provide: CdkAccordionItem,
		useExisting: AccordionComponent,
	}],
	animations: [ACCORDION_TRIGGER, BLOCK_FIRST_ENTER_ANIM],
	encapsulation: ViewEncapsulation.None,
	changeDetection: ChangeDetectionStrategy.OnPush,
	standalone: false,
})
export class AccordionComponent extends CdkAccordionItem implements DoCheck {
	@HostBinding("class")
	readonly hostClass = "elx-accordion";

	@HostBinding("@blockFirstEnterAnim")
	readonly blockFirstEnterAnim = true;

	@Input() panelId = elementId("accordion-panel");

	get buttonId() { return this._header?.buttonId; }

	_hidden: boolean;

	@ContentChild(AccordionHeaderComponent)
	_header?: AccordionHeaderComponent;
	private _headerInitialized = false;

	constructor (
		@Optional() @SkipSelf()
			public accordionGroup: CdkAccordion,
		private _cdRef: ChangeDetectorRef,
		dispatcher: UniqueSelectionDispatcher,
	) {
		super(accordionGroup, _cdRef, dispatcher);
		this._hidden = !this.expanded;
	}

	ngDoCheck(): void {
		if (this._header && !this._headerInitialized) {
			this._headerInitialized = true;
			this._header.controls = this.panelId;
			this._cdRef.detectChanges();
		}
	}

	onAnimationStart(event: AnimationEvent): void {
		if (event.toState === "expanded") {
			this._hidden = false;
			this._cdRef.detectChanges();
		}
	}

	onAnimationDone(event: AnimationEvent): void {
		if (event.toState === "collapsed") {
			this._hidden = true;
			this._cdRef.markForCheck();
		}
	}
}
