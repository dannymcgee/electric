import { DOCUMENT } from "@angular/common";
import { Inject, Injectable, InjectionToken } from "@angular/core";
import { floatToHex, Hex, RGB } from "@electric/utils";
import { BehaviorSubject, Observable } from "rxjs";
import { shareReplay } from "rxjs/operators";

import { ReadonlyThemeColorStore, ThemeColorStore } from "./theme.store";
import {
	ColorSchemeName,
	ThemeColor,
	ThemeColorShade,
	ThemeDefinition,
} from "./theme.types";

export const THEME = new InjectionToken<ThemeDefinition>("Theme");
export const COLOR_SCHEME = new InjectionToken<ColorSchemeName>("ColorScheme");

@Injectable({
	providedIn: "root",
})
export class ThemeService {
	get colorScheme(): ColorSchemeName {
		return this._colorScheme$.value;
	}
	get colorScheme$(): Observable<ColorSchemeName> {
		return this._colorScheme$.pipe(shareReplay({ refCount: false }));
	}
	get currentColors(): ReadonlyThemeColorStore {
		return this._store as ReadonlyThemeColorStore;
	}

	private _store = new ThemeColorStore();
	private _colorScheme$: BehaviorSubject<ColorSchemeName>;
	private _styles: CSSStyleDeclaration;

	constructor (
		@Inject(DOCUMENT) private _document: Document,
		@Inject(THEME) private _theme: ThemeDefinition,
		@Inject(COLOR_SCHEME) initialScheme: ColorSchemeName,
	) {
		this._styles = this._document.documentElement.style;
		this._colorScheme$ = new BehaviorSubject(initialScheme);
		this.setColorScheme(initialScheme);
	}

	setColorScheme(scheme: ColorSchemeName): void {
		try {
			this._store.setColorScheme(this._theme, scheme, this._styles);
			this._colorScheme$.next(scheme);
		} catch (err) {
			console.warn(err.message);
		}
	}

	getHex(
		name: ThemeColor,
		shade: ThemeColorShade,
		alpha?: number,
	): Hex | null {
		let value = this._store.get(name, shade)?.hex ?? null;
		if (value && alpha != null) {
			value += floatToHex(alpha);
		}

		return value;
	}

	getRgb(name: ThemeColor, shade: ThemeColorShade): RGB | null {
		return this._store.get(name, shade)?.rgb ?? null;
	}
}
