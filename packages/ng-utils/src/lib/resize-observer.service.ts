import { coerceElement } from "@angular/cdk/coercion";
import { ElementRef, Injectable, OnDestroy } from "@angular/core";
import { Observable, Subject } from "rxjs";

interface ResizeEntry<T extends Element> extends ResizeObserverEntry {
	target: T;
}

@Injectable()
export class ElxResizeObserver implements OnDestroy {
	private _observer = new ResizeObserver(entries => {
		for (let entry of entries)
			this.dispatch(entry.target, entry);
	});
	private _streams = new Map<Element, Subject<ResizeEntry<any>>>();

	observe<T extends Element>(element: T, options?: ResizeObserverOptions): Observable<ResizeEntry<T>>;
	observe<T extends Element>(elementRef: ElementRef<T>, options?: ResizeObserverOptions): Observable<ResizeEntry<T>>;

	observe<T extends Element>(
		elementOrRef: T | ElementRef<T>,
		options?: ResizeObserverOptions,
	) {
		let element = coerceElement(elementOrRef);
		let subject = new Subject<ResizeEntry<T>>();

		if (this._streams.has(element)) {
			this._streams.get(element)!.complete();
		}
		this._streams.set(element, subject);
		this._observer.observe(element, options);

		return subject;
	}

	ngOnDestroy(): void {
		this._observer.disconnect();
		for (let subject of this._streams.values()) {
			subject.complete();
		}
		this._streams.clear();
	}

	private dispatch<T extends Element>(
		element: T,
		entry: ResizeEntry<T>,
	): void {
		this._streams.get(element)?.next(entry);
	}
}
