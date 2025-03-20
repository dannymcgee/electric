import {
	ChangeDetectorRef,
	Directive,
	EmbeddedViewRef,
	inject,
	Injectable,
	Input,
	OnInit,
	TemplateRef,
	ViewContainerRef,
} from "@angular/core";
import { injectTemplate } from "./inject";

@Injectable({
	providedIn: "root",
})
export class DeferredRenderService {
	private _observer = new IntersectionObserver(entries => this.onReady(entries), {
		rootMargin: "0px",
		threshold: 0,
	})
	private _map = new WeakMap<Element, DeferredRenderDirective>();

	register(proxy: Element, loader: DeferredRenderDirective): void {
		this._map.set(proxy, loader);
		this._observer.observe(proxy);
	}

	private onReady(entries: IntersectionObserverEntry[]): void {
		for (let entry of entries) {
			if (entry.isIntersecting) {
				this._observer.unobserve(entry.target);
				this._map.get(entry.target)?.render();
			}
		}
	}
}

/**
 * Defer rendering a view until it's scrolled into the viewport. Useful for
 * components with expensive initialization routines or excessively long
 * `*ngFor` lists.
 *
 * @example
 * ```html
 * <ng-container
 *   *ngFor="let view of expensiveViews
 *     let i = index"
 * >
 *   <my-expensive-component
 *     *elxDeferRenderWhen="i > 10
 *       proxy: placeholderTemplate"
 *   >
 *     ...
 *   </my-expensive-component>
 * </ng-container>
 *
 * <ng-template #placeholderTemplate>
 *   <div class="cheap-placeholder"></div>
 * </ng-template>
 * ```
 *
 * If you don't need the condition, you can drop the "when" and pass your
 * placeholder template straight into the directive input:
 *
 * @example
 * ```html
 * <ng-container *ngFor="let view of alwaysDeferredViews">
 *   <my-deferred-component *elxDeferRender="placeholderTemplate">
 *     ...
 *   </my-deferred-component>
 * </ng-container>
 *
 * <ng-template #placeholderTemplate>
 *   <div class="cheap-placeholder"></div>
 * </ng-template>
 * ```
 */
@Directive({
	selector: "[elxDeferRender], [elxDeferRenderWhen]",
	standalone: false,
})
export class DeferredRenderDirective<T extends object = any> implements OnInit {
	@Input("elxDeferRenderWhen")
	deferWhen = true;

	@Input("elxDeferRender")
	_proxyTemplateA?: TemplateRef<T>;

	@Input("elxDeferRenderWhenProxy")
	_proxyTemplateB?: TemplateRef<T>;

	@Input("elxDeferRenderWhenContext")
	get _proxyContext() { return this.#proxyContext; }
	set _proxyContext(value) {
		this.#proxyContext = value;
		this.onContextChange(value);
	}
	#proxyContext?: T;

	get proxyTemplate() { return this._proxyTemplateA ?? this._proxyTemplateB; }

	private _viewRef?: EmbeddedViewRef<T>;

	private _cdRef = inject(ChangeDetectorRef);
	private _renderService = inject(DeferredRenderService);
	private _template = injectTemplate<void>();
	private _viewContainer = inject(ViewContainerRef);

	ngOnInit(): void {
		if (!this.proxyTemplate) {
			throw new Error("Proxy template for DeferredRenderDirective may not be null");
		}

		if (this.deferWhen) {
			this._viewRef = this._viewContainer.createEmbeddedView(
				this.proxyTemplate,
				this._proxyContext,
			);
			this._renderService.register(this._viewRef.rootNodes[0], this);
		}
		else {
			this._viewContainer.createEmbeddedView(this._template);
		}
	}

	private onContextChange(value?: T): void {
		if (this._viewRef?.context && value) {
			Object.assign(this._viewRef.context, value);
			this._viewRef.markForCheck();
		}
	}

	render(): void {
		this._viewContainer.clear();
		this._viewContainer.createEmbeddedView(this._template);
		this._cdRef.markForCheck();
	}
}
