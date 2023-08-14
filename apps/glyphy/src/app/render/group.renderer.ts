import {
	AfterViewInit,
	Directive,
	EventEmitter,
	OnDestroy,
	Output,
	ViewChildren,
} from "@angular/core";
import { QueryList } from "@electric/ng-utils";
import {
	animationFrameScheduler,
	merge,
	ReplaySubject,
	shareReplay,
	startWith,
	switchMap,
	takeUntil,
	throttleTime,
} from "rxjs";

import { RenderElement, RENDER_ELEMENT } from "./render.types";

@Directive()
export abstract class GroupRenderer
	implements RenderElement, AfterViewInit, OnDestroy
{
	@Output("changes") changes$ = new EventEmitter<void>();

	@ViewChildren(RENDER_ELEMENT)
	protected children!: QueryList<RenderElement>;

	protected onDestroy$ = new ReplaySubject<void>();

	ngAfterViewInit(): void {
		const children$ = this.children.changes.pipe(
			startWith(this.children),
			shareReplay({ bufferSize: 1, refCount: true }),
			takeUntil(this.onDestroy$),
		);

		const childrenChanges$ = children$.pipe(
			switchMap(ql => merge(...ql.map(el => el.changes$))),
			takeUntil(this.onDestroy$),
		);

		merge(children$, childrenChanges$)
			.pipe(
				throttleTime(0, animationFrameScheduler, {
					leading: true,
					trailing: true,
				}),
				takeUntil(this.onDestroy$),
			)
			.subscribe(() => {
				this.changes$.emit();
			});
	}

	ngOnDestroy(): void {
		this.onDestroy$.next();
		this.onDestroy$.complete();
	}

	onDraw(ctx: CanvasRenderingContext2D): void {
		if (this.children)
			for (let element of this.children)
				element.onDraw(ctx);
	}
}
