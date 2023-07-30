import { InjectionToken } from "@angular/core";

import { Font } from "./font";

// TODO: Remove
export interface FontProvider {
	font?: Font;
}

export const FONT_PROVIDER = new InjectionToken<FontProvider>("FontProvider");

export function fontProviderFactory(provider: FontProvider) {
	return provider.font ?? null;
}
