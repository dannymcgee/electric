import {
	ChangeDetectionStrategy,
	Component,
	ContentChild,
	DoCheck,
	Host,
	HostBinding,
	Inject,
	Input,
	Optional,
	Self,
	SkipSelf,
	ViewEncapsulation,
} from "@angular/core";
import {
	AsyncValidator,
	AsyncValidatorFn,
	ControlContainer,
	NgModelGroup,
	NG_ASYNC_VALIDATORS,
	NG_VALIDATORS,
	Validator,
	ValidatorFn,
} from "@angular/forms";
import { DetectChanges } from "@electric/ng-utils";
import { elementId } from "@electric/utils";
import { FormLabel, FORM_LABEL } from "../form-controls.types";

@Component({
	selector: "elx-fieldset",
	template: `

<ng-content></ng-content>

	`,
	styleUrls: ["./fieldset.component.scss"],
	providers: [{
		provide: ControlContainer,
		useExisting: FieldsetComponent,
	}],
	encapsulation: ViewEncapsulation.None,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FieldsetComponent
	extends NgModelGroup
	implements DoCheck
{
	@Input() override name!: string;

	@HostBinding("attr.role")
	@Input() role: "group"|"radiogroup" = "group";

	@HostBinding("class")
	readonly hostClass = "elx-fieldset";

	@DetectChanges()
	@HostBinding("attr.aria-labelledby")
	_labelledBy: string | null = null;

	@ContentChild(FORM_LABEL)
	private _label?: FormLabel;

	constructor (
		@Host() @SkipSelf()
		parent: ControlContainer,

		@Optional() @Self() @Inject(NG_VALIDATORS)
		validators: (Validator|ValidatorFn)[],

		@Optional() @Self() @Inject(NG_ASYNC_VALIDATORS)
		asyncValidators: (AsyncValidator|AsyncValidatorFn)[],
	) {
		super(parent, validators, asyncValidators);
	}

	ngDoCheck(): void {
		if (this._label && !this._labelledBy) {
			const id = this._label.id ?? elementId("fieldset-legend");
			if (this._label.id !== id)
				this._label.id = id;

			this._labelledBy = id;
		}
	}
}
