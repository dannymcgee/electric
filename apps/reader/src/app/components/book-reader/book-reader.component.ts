import {
	Component,
	ChangeDetectionStrategy,
	Input,
	Output,
	EventEmitter,
	ViewChild,
	ElementRef,
	OnInit,
	OnDestroy,
	ViewChildren,
	AfterViewInit,
	TrackByFunction,
	ViewContainerRef,
} from "@angular/core";
import { ComponentOutletDirective, QueryList } from "@electric/ng-utils";
import { isNotNull } from "@electric/utils";
import { map, startWith, Subject, takeUntil } from "rxjs";

import { Library } from "../../library.service";
import { BookSectionComponent } from "../book-section/book-section.component";
import { BookReaderService, NavPoint } from "./book-reader.service";

@Component({
	selector: "r-book-reader",
	template: `
<section #toc class="toc"
	*ngIf="(_reader.navPoints$ | async) as navPoints"
	role="list"
>
	<r-nav-point
		*ngFor="let point of navPoints
			trackBy: trackByHref"
		[activeId]="(activeId$ | async) ?? undefined"
		[href]="point.href"
		[children]="point.children"
	>
		{{ point.label }}
	</r-nav-point>
</section>

<main class="content"
	#scrollContainer
	[style.--fs.px]="fontSize"
>
	<header class="toolbar"
		[style.left.px]="toc?.nativeElement?.offsetWidth"
	>
		<input elx-input="number"
			[(ngModel)]="fontSize"
		/>

		<button elx-btn class="close"
			icon="CancelSmall"
			aria-label="Close"
			(click)="close.emit()"
		></button>
	</header>

	<ng-container *ngIf="(_reader.sections$ | async) as sections">
		<ng-container *ngFor="let section of sections">
			<ng-container *ngIf="(section.content | async) as content">
				<ng-container
					*elxComponentOutlet="BookSectionComponent
						content: content
						inputs: {
							id: section.id
						}"
				></ng-container>
			</ng-container>
		</ng-container>
	</ng-container>
</main>

`,
	styleUrls: ["./book-reader.component.scss"],
	providers: [BookReaderService],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookReaderComponent implements OnInit, AfterViewInit, OnDestroy {
	@Input()
	get id() { return this._id; }
	set id(value) {
		this._id = value;
		const book = this._library.getById(value);
		if (book) this._reader.load(book);
	}
	private _id!: string;

	@Output() close = new EventEmitter<void>();

	@ViewChild("toc", { read: ElementRef })
	toc?: ElementRef<HTMLElement>;

	@ViewChild("scrollContainer", {
		read: ElementRef,
		static: true,
	})
	scrollContainer?: ElementRef<HTMLElement>;

	BookSectionComponent = BookSectionComponent;
	fontSize = 20;
	activeId$ = new Subject<string>();
	get injector() { return this._viewContainer.injector; }
	trackByHref: TrackByFunction<NavPoint> = (_, it) => it.href;

	@ViewChildren(ComponentOutletDirective)
	private _componentOutlets!: QueryList<ComponentOutletDirective<BookSectionComponent>>;

	private _scrollSpy!: IntersectionObserver;
	private _onDestroy$ = new Subject<void>();

	constructor (
		private _library: Library,
		public _reader: BookReaderService,
		private _viewContainer: ViewContainerRef,
	) {}

	ngOnInit(): void {
		this._scrollSpy = new IntersectionObserver(this.scrollSpyCallback, {
			root: this.scrollContainer!.nativeElement,
			threshold: 0,
		});
	}

	ngAfterViewInit(): void {
		this._componentOutlets.changes
			.pipe(
				startWith(this._componentOutlets),
				map(outlets => outlets
					.map(outlet => {
						const instance = outlet.instance;
						if (!instance) return null;
						return instance.element;
					})
					.filter(isNotNull)
				),
				takeUntil(this._onDestroy$),
			)
			.subscribe(sections => {
				for (let section of sections)
					this._scrollSpy.observe(section);
			});
	}

	ngOnDestroy(): void {
		this._scrollSpy.disconnect();
		this._onDestroy$.next();
		this._onDestroy$.complete();
		this.activeId$.complete();
	}

	scrollSpyCallback: IntersectionObserverCallback = entries => {
		// FIXME: This doesn't work as well while scrolling up
		const entry = entries
			.filter(entry => entry.isIntersecting)
			.filter(entry => !!entry.target.id)
			.pop();

		if (!entry) return;

		this.activeId$.next(entry.target.id);
	}
}
