import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ContentChild,
	Directive,
	forwardRef,
	HostBinding,
	inject,
	Input,
	TemplateRef,
	ViewEncapsulation,
} from "@angular/core";

import { Coerce, DetectChanges } from "@electric/ng-utils";

import { FormLabel, FORM_LABEL } from "../form-controls.types";

@Component({
	selector: "elx-label",
	template: `

<ng-template
	*ngIf="_prefixTemplate"
	[ngTemplateOutlet]="_prefixTemplate"
></ng-template>

<label class="elx-label__label"
	*ngIf="useNative"
	[attr.for]="for"
>
	<ng-template [ngTemplateOutlet]="labelContent"></ng-template>
</label>

<span class="elx-label__label"
	*ngIf="!useNative"
	[id]="id"
>
	<ng-template [ngTemplateOutlet]="labelContent"></ng-template>
</span>

<ng-template #labelContent>
	<ng-content></ng-content>
</ng-template>

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
	@Input() id?: string;

	@DetectChanges()
	@Input() for?: string;

	@DetectChanges()
	@Coerce(Boolean)
	@Input() useNative?: boolean;

	@HostBinding("attr.id")
	readonly _idFix = null;

	@HostBinding("attr.for")
	readonly _forFix = null;

	get _prefixTemplate() { return this._prefix?.templateRef; }
	get _postfixTemplate() { return this._postfix?.templateRef; }

	@ContentChild(forwardRef(() => LabelPrefixDirective))
	private _prefix?: LabelPrefixDirective;

	@ContentChild(forwardRef(() => LabelPostfixDirective))
	private _postfix?: LabelPostfixDirective;

	private _cdRef = inject(ChangeDetectorRef);
	get changeDetector() { return this._cdRef; }
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
