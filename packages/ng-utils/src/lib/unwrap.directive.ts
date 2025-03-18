import { Directive, EmbeddedViewRef, Input, TemplateRef, ViewContainerRef } from "@angular/core";

interface Ctx<T> {
	$implicit?: T;
	elxUnwrap?: T;
}

@Directive({
	selector: "[elxUnwrap]",
	standalone: false,
})
export class UnwrapDirective<T> {
	@Input("elxUnwrap")
	get unwrapped() { return this._unwrapped; }
	set unwrapped(value) {
		this._unwrapped = value;
		this.update();
	}
	private _unwrapped?: T;

	private _view?: EmbeddedViewRef<Ctx<T>>;

	constructor (
		private _template: TemplateRef<Ctx<T>>,
		private _viewContainer: ViewContainerRef,
	) {}

	private update(): void {
		if (this._view?.context == null) {
			this._viewContainer.clear();
			this._view = this._viewContainer.createEmbeddedView(this._template, {
				$implicit: this.unwrapped,
				elxUnwrap: this.unwrapped,
			});
		} else {
			this._view.context.$implicit = this.unwrapped;
			this._view.context.elxUnwrap = this.unwrapped;
		}
	}
}
