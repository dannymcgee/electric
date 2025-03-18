import { ElementRef, inject, TemplateRef } from "@angular/core";

export function injectRef<T extends Element>() {
	return inject<ElementRef<T>>(ElementRef);
}

export function injectTemplate<T>() {
	return inject<TemplateRef<T>>(TemplateRef);
}
