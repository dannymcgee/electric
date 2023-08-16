import {
	ChangeDetectionStrategy,
	Component,
	Input,
	OnChanges,
	OnInit,
	SimpleChanges,
} from "@angular/core";
import { ThemeService } from "@electric/components";
import { Const, Option, replayUntil } from "@electric/utils";
import {
	BehaviorSubject,
	map,
	Observable,
	of,
	race,
	Subject,
	takeUntil,
} from "rxjs";

import { FontMetrics } from "../../family";
import { IRect, Matrix } from "../../math";
import { GroupRenderer, RenderElement, RENDER_ELEMENT } from "../../render";
import { Glyph } from "../glyph";
import { Path } from "../path";
import { EditorPoint } from "./types";

// TODO: There's a lot of copypasta between this and ContourEditorTool.
//       Would be nice to have a better abstraction for varying behavior while
//       sharing large parts of the view.

@Component({
	selector: "g-pen-tool",
	templateUrl: "./pen.tool.html",
	providers: [{
		provide: RENDER_ELEMENT,
		useExisting: PenTool,
	}],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PenTool
	extends GroupRenderer
	implements RenderElement, OnChanges, OnInit
{
	@Input() glyph!: Const<Glyph>;
	@Input() outline?: Const<Path>;
	@Input() metrics!: Const<FontMetrics>;

	@Input() viewRect!: Const<IRect>;
	@Input() glyphToCanvas!: Const<Matrix>;
	@Input() canvasToGlyph!: Const<Matrix>;

	points$: Observable<EditorPoint[]> = of([]);

	private _outline$ = new BehaviorSubject<Option<Const<Path>>>(null);
	private _newOutlineEvent$ = new Subject<void>();

	constructor (
		public theme: ThemeService,
	) {
		super();
	}

	ngOnChanges(changes: SimpleChanges): void {
		if ("outline" in changes) {
			this._newOutlineEvent$.next();

			const outline = this.outline;
			this._outline$.next(outline);

			outline?.changes$
				.pipe(takeUntil(race(
					this._newOutlineEvent$,
					this.onDestroy$,
				)))
				.subscribe(() => {
					this._outline$.next(outline);
				});
		}
	}

	ngOnInit(): void {
		this.points$ = this._outline$.pipe(
			map(outline => {
				if (!outline) return [];
				return outline.contours
					.flatMap((contour, ci) => contour.points
						.map((point, pi) => new EditorPoint(ci, pi, point))
						.filter(p => !p.hidden)
					)
			}),
			replayUntil(this.onDestroy$),
		);
	}
}
