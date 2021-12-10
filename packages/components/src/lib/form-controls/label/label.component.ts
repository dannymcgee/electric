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

import { FormLabel, FORM_LABEL } from "../form-controls.types";

@Component({
	selector: "elx-label",
	templateUrl: "./label.component.html",
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
