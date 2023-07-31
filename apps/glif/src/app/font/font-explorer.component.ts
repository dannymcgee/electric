import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	HostBinding,
	OnDestroy,
	OnInit,
} from "@angular/core";
import { ElxResizeObserver, ResizeEntry } from "@electric/ng-utils";
import { anim } from "@electric/style";
import { debounceTime, map, Observable, Subject, takeUntil } from "rxjs";

import { FamilyService } from "../family";
import { Glyph } from "../glyph";
import { UNICODE_RANGES } from "./unicode-ranges";

class UnicodeGroup {
	glyphs: Glyph[] = [];
	constructor (public name: string) {}
}

@Component({
	selector: "g-font-explorer",
	templateUrl: "./font-explorer.component.html",
	styleUrls: ["./font-explorer.component.scss"],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FontExplorerComponent implements OnInit, OnDestroy {
	@HostBinding("style.--cols")
	cols = 12;

	// TODO: User configuration
	groupByCharacterSet = true;

	get font$() { return this._familyService.font$; }
	unicodeGroups$!: Observable<UnicodeGroup[]>;

	private _onDestroy$ = new Subject<void>();

	constructor (
		private _cdRef: ChangeDetectorRef,
		private _elementRef: ElementRef<HTMLElement>,
		private _familyService: FamilyService,
		private _resizeObserver: ElxResizeObserver,
	) {}

	ngOnInit(): void {
		this.unicodeGroups$ = this._familyService.font$.pipe(
			map(font => {
				if (!font) return [];

				const groups = new Map<string, UnicodeGroup>();
				groups.set("Other", new UnicodeGroup("Other"));

				// TODO: Figure out a better algorithm
				for (let glyph of font.glyphs) {
					if (glyph.charCode == null) {
						groups.get("Other")!.glyphs.push(glyph);
						continue;
					}

					const entry = UNICODE_RANGES.find(entry => {
						const [key] = entry;
						if (key && Array.isArray(key[0])) {
							const ranges = key as [number, number][]
							return ranges.some(([start, end]) => (
								glyph.charCode! >= start && glyph.charCode! <= end
							));
						}
						const [start, end] = key as [number, number];
						return (glyph.charCode! >= start && glyph.charCode! <= end);
					});

					if (entry) {
						const [,name] = entry;
						if (!groups.has(name))
							groups.set(name, new UnicodeGroup(name));

						groups.get(name)!.glyphs.push(glyph);
					}
					else {
						groups.get("Other")!.glyphs.push(glyph);
					}
				}

				const result = UNICODE_RANGES
					.map(([,name]) => groups.get(name) ?? new UnicodeGroup(name))
					.concat(groups.get("Other")!);

				return result;
			}),
			takeUntil(this._onDestroy$),
		);

		this._resizeObserver
			.observe(this._elementRef)
			.pipe(
				debounceTime(anim.frameTime(1)),
				takeUntil(this._onDestroy$),
			)
			.subscribe({
				next: entry => {
					this.onResize(entry);
				},
				complete: () => {
					this._resizeObserver.unobserve(this._elementRef);
				},
			});
	}

	ngOnDestroy(): void {
		this._onDestroy$.next();
		this._onDestroy$.complete();
	}

	private onResize(entry: ResizeEntry<HTMLElement>): void {
		const { width } = entry.contentRect;
		const glyphHeight = 96;
		const targetRatio = 7 / 8;
		/*
		   ratio = (width / cols) / glyphHeight
		       r = (w/c) / gh
		   r(gh) = w/c
		r(gh)(c) = w
		    r(c) = w/gh
		       c = (w/gh) / r
		*/
		const cols = Math.floor((width / glyphHeight) / targetRatio);
		if (cols !== this.cols) {
			this.cols = cols;
			this._cdRef.markForCheck();
		}
	}
}
