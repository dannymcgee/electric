import {
	AfterContentInit,
	Component,
	ContentChild,
	HostBinding,
	OnDestroy,
} from "@angular/core";
import { Subject, takeUntil } from "rxjs";

import { anim } from "@electric/style";

import { ExampleControlsComponent } from "./example-controls/example-controls.component";
import { ExampleCodeComponent } from "./example-code/example-code.component";

@Component({
	selector: "showcase-example",
	template: `

<ng-content select="showcase-example-demo"></ng-content>
<ng-content select="showcase-example-code"></ng-content>
<ng-content select="showcase-example-controls"></ng-content>

	`,
	styles: [`

:host {
	display: grid;
	grid-template-areas:
		"example-demo example-controls"
		"example-code example-controls";
	width: 100%;
	height: 100%;
}

	`],
})
export class ExampleComponent implements AfterContentInit, OnDestroy {
	@HostBinding("style.grid-template-columns")
	get columns() {
		return `1fr ${this._controlsWidth}px`;
	}

	@HostBinding("style.grid-template-rows")
	get rows() {
		return `1fr ${this._codeHeight}px`;
	}

	private _controlsWidth = 256;
	private _codeHeight = 352;

	@ContentChild(ExampleControlsComponent, { static: true })
	private _controls!: ExampleControlsComponent;

	@ContentChild(ExampleCodeComponent, { static: true })
	private _code!: ExampleCodeComponent;

	private _onDestroy$ = new Subject<void>();

	ngAfterContentInit(): void {
		this._controls.resizeHandle.move
			.pipe(takeUntil(this._onDestroy$))
			.subscribe(event => {
				let updated = this._controlsWidth - event.x;
				this._controlsWidth = anim.clamp(updated, [128, 512]);
			});

		this._code.resizeHandle.move
			.pipe(takeUntil(this._onDestroy$))
			.subscribe(event => {
				let updated = this._codeHeight - event.y;
				this._codeHeight = anim.clamp(updated, [128, 640]);
			});
	}

	ngOnDestroy(): void {
		this._onDestroy$.next();
		this._onDestroy$.complete();
	}
}
