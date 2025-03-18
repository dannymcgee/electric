import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	HostBinding,
	inject,
	OnDestroy,
	OnInit,
	Output,
} from "@angular/core";
import { ResizeEntry } from "@electric/ng-utils";
import { exists } from "@electric/utils";
import { filter, map, Observable, Subject, takeUntil } from "rxjs";

import { FamilyService } from "../family";
import { Glyph } from "../glyph";
import { Font } from "./font";
import { UNICODE_RANGES } from "./unicode-ranges";

class UnicodeGroup {
	glyphs: Glyph[] = [];
	constructor (public name: string) {}
}

const FONT_GROUPS_LUT = new Map<Font, UnicodeGroup[]>();

@Component({
	selector: "g-font-explorer",
	templateUrl: "./font-explorer.component.html",
	styleUrls: ["./font-explorer.component.scss"],
	changeDetection: ChangeDetectionStrategy.OnPush,
	standalone: false,
})
export class FontExplorerComponent implements OnInit, OnDestroy {
	@HostBinding("style.--cols")
	cols = 13;

	@HostBinding("style.--ascender")
	ascender?: number;

	@HostBinding("style.--descender")
	descender?: number;

	@Output() openGlyph = new EventEmitter<Glyph>();

	// TODO: User configuration
	groupByCharacterSet = true;

	get font$() { return this._familyService.font$; }
	unicodeGroups$!: Observable<UnicodeGroup[]>;

	private _onDestroy$ = new Subject<void>();
	private _cdRef = inject(ChangeDetectorRef);
	private _familyService = inject(FamilyService);

	ngOnInit(): void {
		this._familyService.family$
			.pipe(
				filter(exists),
				takeUntil(this._onDestroy$),
			)
			.subscribe(family => {
				this.ascender = family.ascender;
				this.descender = family.descender;
			});

		this.unicodeGroups$ = this._familyService.font$.pipe(
			map(font => {
				if (!font) return [];

				if (FONT_GROUPS_LUT.has(font))
					return FONT_GROUPS_LUT.get(font)!;

				// performance.mark("unicodeGroups.map.start");

				const groups = new Map<string, UnicodeGroup>();
				groups.set("Other", new UnicodeGroup("Other"));

				// TODO: Figure out a better algorithm
				for (let glyph of font.glyphs) {
					if (glyph.unicode == null) {
						groups.get("Other")!.glyphs.push(glyph);
						continue;
					}

					const entry = UNICODE_RANGES.find(entry => {
						const [key] = entry;
						if (key && Array.isArray(key[0])) {
							const ranges = key as [number, number][]
							return ranges.some(([start, end]) => (
								glyph.unicode! >= start && glyph.unicode! <= end
							));
						}
						const [start, end] = key as [number, number];
						return (glyph.unicode! >= start && glyph.unicode! <= end);
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

				// performance.mark("unicodeGroups.map.end");
				// performance.measure("unicodeGroups.map",
				// 	"unicodeGroups.map.start",
				// 	"unicodeGroups.map.end",
				// );

				FONT_GROUPS_LUT.set(font, result);

				return result;
			}),
			takeUntil(this._onDestroy$),
		);
	}

	ngOnDestroy(): void {
		this._onDestroy$.next();
		this._onDestroy$.complete();
	}

	// FIXME: This is slow and janky since it needs to run post-render/layout.
	// Should just compute the ideal columns per screen-width offline and set
	// them up via media queries in CSS
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
