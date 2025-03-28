import { coerceBooleanProperty } from "@angular/cdk/coercion";
import { Overlay, OverlayRef } from "@angular/cdk/overlay";
import { TemplatePortal } from "@angular/cdk/portal";
import {
	Directive,
	EmbeddedViewRef,
	HostAttributeToken,
	inject,
	Input,
	ViewContainerRef,
} from "@angular/core";
import { injectTemplate } from "@electric/ng-utils";

interface DialogTriggerContext<T> {
	$implicit?: T;
	elxDialogTrigger?: T;
}

@Directive({
	selector: "[elxDialogTrigger]",
	standalone: false,
})
export class DialogTriggerDirective<T> {
	@Input("elxDialogTrigger")
	get trigger() { return this._trigger; }
	set trigger(value) {
		if (this._trigger !== value) {
			this.onTriggerChange(value);
			this._trigger = value;
		}
	}
	private _trigger?: T;

	private _overlayRef?: OverlayRef;
	private get overlayRef() {
		return this._overlayRef ??= this.createOverlayRef();
	}

	private get _isBlocking() {
		return coerceBooleanProperty(this._blockingAttr)
			|| this._roleAttr === "alert";
	}

	private _portal: TemplatePortal<DialogTriggerContext<T>> | null = null;
	private _viewRef: EmbeddedViewRef<DialogTriggerContext<T>> | null = null;

	private _overlay = inject(Overlay);
	private _template = injectTemplate<DialogTriggerContext<T>>();
	private _viewContainer = inject(ViewContainerRef);

	private _blockingAttr = inject(new HostAttributeToken("blocking"), { optional: true });
	private _roleAttr = inject(new HostAttributeToken("role"), { optional: true }) ?? "dialog";

	private onTriggerChange(value?: T): void {
		if (value) {
			if (this.overlayRef.hasAttached()) {
				this._viewRef!.context.$implicit = value;
				this._viewRef!.context.elxDialogTrigger = value;
				this._viewRef!.markForCheck();
			} else {
				this.attachOverlay();
			}
		} else if (this._overlayRef?.hasAttached()) {
			this.detachOverlay();
		}
	}

	private attachOverlay(): void {
		this._portal = new TemplatePortal(this._template, this._viewContainer, {
			$implicit: this.trigger,
			elxDialogTrigger: this.trigger,
		});
		this._viewRef = this.overlayRef.attach(this._portal);
	}

	private detachOverlay(): void {
		this.overlayRef.detach();
		this._viewRef?.destroy();
		this._portal = null;
	}

	private createOverlayRef(): OverlayRef {
		let backdropClass = ["elx-dialog-backdrop"];
		let panelClass = ["elx-dialog-overlay"];

		if (this._isBlocking) {
			backdropClass.push("elx-dialog-backdrop--blocking");
			panelClass.push("elx-dialog-overlay--blocking");
		}

		return this._overlay.create({
			positionStrategy: this._overlay.position().global(),
			hasBackdrop: true,
			backdropClass,
			panelClass,
		});
	}
}
