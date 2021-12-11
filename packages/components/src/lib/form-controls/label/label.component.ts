import {
	ChangeDetectionStrategy,
	Component,
	ContentChild,
	Directive,
	forwardRef,
	HostBinding,
	Input,
	TemplateRef,
	ViewEncapsulation,
} from "@angular/core";

import { DetectChanges } from "@electric/ng-utils";

import { FormLabel, FORM_LABEL, LEGEND, Legend } from "../form-controls.types";

@Component({
	selector: "elx-label",
	template: `

<ng-template
	*ngIf="_prefixTemplate"
	[ngTemplateOutlet]="_prefixTemplate"
></ng-template>

<label class="elx-label__label"
	[attr.for]="for"
><ng-content></ng-content></label>

<ng-template
	*ngIf="_postfixTemplate"
	[ngTemplateOutlet]="_postfixTemplate"
></ng-template>

	`,
	styleUrls: ["./label.component.scss"],
	providers: [{
		provide: FORM_LABEL,
		useExisting: LabelComponent,
	}],
	encapsulation: ViewEncapsulation.None,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabelComponent implements FormLabel {
	@HostBinding("class")
	readonly hostClass = "elx-label";

	@DetectChanges()
	@Input() for?: string;

	get _prefixTemplate() { return this._prefix?.templateRef; }
	get _postfixTemplate() { return this._postfix?.templateRef; }

	@ContentChild(forwardRef(() => LabelPrefixDirective))
	private _prefix?: LabelPrefixDirective;

	@ContentChild(forwardRef(() => LabelPostfixDirective))
	private _postfix?: LabelPostfixDirective;
}

@Component({
	selector: "elx-legend",
	template: `

<ng-template
	*ngIf="_prefixTemplate"
	[ngTemplateOutlet]="_prefixTemplate"
></ng-template>

<span class="elx-label__label"
	[id]="id"
><ng-content></ng-content></span>

<ng-template
	*ngIf="_postfixTemplate"
	[ngTemplateOutlet]="_postfixTemplate"
></ng-template>

	`,
	styleUrls: ["./label.component.scss"],
	providers: [{
		provide: LEGEND,
		useExisting: LegendComponent,
	}],
	encapsulation: ViewEncapsulation.None,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LegendComponent
extends LabelComponent
implements Legend {
	override for?: string;

	@DetectChanges()
	@Input() id?: string;

	@HostBinding("attr.id")
	readonly _idFix = null;
}

@Directive({
	selector: "[elxLabelPrefix]",
})
export class LabelPrefixDirective {
	constructor (
		public templateRef: TemplateRef<void>,
	) {}
}

@Directive({
	selector: "[elxLabelPostfix]",
})
export class LabelPostfixDirective {
	constructor (
		public templateRef: TemplateRef<void>,
	) {}
}
