import { coerceElement } from "@angular/cdk/coercion";
import { ElementRef, Injectable, OnDestroy } from "@angular/core";
import { Observable, ReplaySubject, Subject } from "rxjs";

export interface ResizeEntry<T extends Element> extends ResizeObserverEntry {
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
		if (this._streams.has(element)) {
			let stream = this._streams.get(element)!;
			if (!stream.closed) {
				if (options) {
					console.warn(
						`Custom options were passed to ElxResizeObserver.observe, but `
						+ `the given element is already being observed, so the new `
						+ `options will be ignored! \n\n`
						+ `If this is undesirable, consider providing a unique `
						+ `ElxResizeObserver instance for the second observer instead `
						+ `of injecting the root instance.`
					);
				}
				return stream;
			}
		}

		let subject = new ReplaySubject<ResizeEntry<T>>(1);
		this._streams.set(element, subject);
		this._observer.observe(element, options);

		return subject;
	}

	unobserve<T extends Element>(element: T): void;
	unobserve<T extends Element>(elementRef: ElementRef<T>): void;

	unobserve<T extends Element>(elementOrRef: T | ElementRef<T>): void {
		let element = coerceElement(elementOrRef);

		if (this._streams.has(element)) {
			let stream = this._streams.get(element)!;
			// It's possible there's more than one observer of this stream
			if (!stream.observed) {
				if (!stream.closed) stream.complete();

				this._observer.unobserve(element);
				this._streams.delete(element);
			}
		}
		else {
			this._observer.unobserve(element);
		}
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
		let stream = this._streams.get(element);
		if (!stream || stream.closed) {
			this._observer.unobserve(element);
			if (stream) this._streams.delete(element);
		}
		else {
			stream.next(entry);
		}
	}
}
