import { Highlightable, ListKeyManagerOption } from "@angular/cdk/a11y";
import {
	Component,
	ViewEncapsulation,
	ChangeDetectionStrategy,
	ViewChild,
	TemplateRef,
	Input,
	HostBinding,
	Output,
	EventEmitter,
	HostListener,
	ElementRef,
} from "@angular/core";
import { DetectChanges } from "@electric/ng-utils";
import { elementId } from "@electric/utils";

import { Option, OPTION } from "../select.types";

@Component({
	selector: "elx-option",
	templateUrl: "./option.component.html",
	styleUrls: ["./option.component.scss"],
	providers: [{
		provide: OPTION,
		useExisting: OptionComponent,
	}],
	encapsulation: ViewEncapsulation.None,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OptionComponent<T>
implements
	Option<T>,
	ListKeyManagerOption,
	Highlightable
{
	@HostBinding("class")
	readonly hostClass = "elx-option";

	@HostBinding("attr.role")
	readonly role = "option";

	@HostBinding("attr.id")
	@Input() id = elementId("option");

	@Input() value?: T;

	@HostBinding("attr.aria-disabled")
	@Input() disabled?: boolean;

	@HostBinding("class.active")
	@HostBinding("attr.aria-selected")
	@DetectChanges()
	_active: true|null = null;

	@ViewChild(TemplateRef, { static: true })
	@DetectChanges()
	template!: TemplateRef<void>

	@Output() select = new EventEmitter<Option<T>>();

	constructor (
		private _elementRef: ElementRef<HTMLElement>,
	) {}

	@HostListener("click")
	onSelect(): void {
		this.select.emit(this);
	}

	getLabel(): string {
		let result = [] as string[];
		this._elementRef.nativeElement.childNodes.forEach(node => {
			this.accumLabel(node, result);
		});
		return result.join(" ");
	}

	private accumLabel(node: Node, accum: string[]): void {
		switch (node.nodeType) {
			case Node.TEXT_NODE: {
				if (node.nodeValue)
					accum.push(node.nodeValue.trim());
				break;
			}
			case Node.ELEMENT_NODE: {
				let element = node as Element;
				let attrs = element.attributes;

				if (attrs.getNamedItem("aria-hidden"))
					break;

				let ariaLabel: string | undefined;
				if ((ariaLabel = attrs.getNamedItem("aria-label")?.value)) {
					accum.push(ariaLabel);
					break;
				}

				node.childNodes.forEach(node => {
					this.accumLabel(node, accum)
				});

				break;
			}
		}
	}

	setActiveStyles(): void {
		this._active = true;
	}

	setInactiveStyles(): void {
		this._active = null;
	}
}
