import {
	Component,
	ViewEncapsulation,
	ChangeDetectionStrategy,
	Input,
	HostBinding,
	Output,
	EventEmitter,
	OnInit,
} from "@angular/core";

import { DetectChanges } from "@electric/ng-utils";
import { elementId } from "@electric/utils";

import { RADIO, Radio } from "./radio.types";

@Component({
	selector: "elx-radio",
	templateUrl: "./radio.component.html",
	styleUrls: ["./radio.component.scss"],
	providers: [{
		provide: RADIO,
		useExisting: RadioComponent,
	}],
	encapsulation: ViewEncapsulation.None,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RadioComponent<T> implements Radio<T>, OnInit {
	@HostBinding("class")
	readonly hostClass = "elx-radio";

	@DetectChanges()
	@Input() name?: string;

	@DetectChanges()
	@Input() value!: T;

	@DetectChanges()
	@Input() disabled?: boolean;

	@DetectChanges()
	@Input() checked!: boolean;
	@Output() checkedChange = new EventEmitter<boolean>();

	@Input() id!: string;

	ngOnInit(): void {
		if (!this.id) {
			this.id = elementId("radio");
		}
	}
}
