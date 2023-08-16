import {
	ChangeDetectionStrategy,
	Component,
	EmbeddedViewRef,
	HostBinding,
	TemplateRef,
	ViewChild,
	ViewContainerRef,
	ViewEncapsulation,
} from "@angular/core";

@Component({
	template: `<ng-container #viewContainer></ng-container>`,
	styleUrls: ["./tooltip.component.scss"],
	changeDetection: ChangeDetectionStrategy.OnPush,
	encapsulation: ViewEncapsulation.None,
})
export class TooltipComponent {
	@HostBinding("class")
	readonly hostClass = "elx-tooltip";

	@ViewChild("viewContainer", { read: ViewContainerRef, static: true })
	private _viewContainer!: ViewContainerRef;

	createEmbeddedView<T>(
		template: TemplateRef<T>,
		context?: T,
		index?: number,
	): EmbeddedViewRef<T> {
		return this._viewContainer.createEmbeddedView(template, context, index);
	}
}
