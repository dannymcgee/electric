import {
	Component,
	ChangeDetectionStrategy,
	Input,
	Output,
	EventEmitter,
	ViewChild,
	ElementRef,
} from "@angular/core";

import { Library } from "../../library.service";
import { BookSectionComponent } from "../book-section/book-section.component";
import { BookReaderService } from "./book-reader.service";

@Component({
	selector: "r-book-reader",
	template: `
<section #toc class="toc"
	*ngIf="(_reader.navPoints$ | async) as navPoints"
	role="list"
>
	<r-nav-point *ngFor="let point of navPoints"
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
			<ng-container *ngIf="(section.content | async) as content"
				[ngComponentOutlet]="BookSectionComponent"
				[ngComponentOutletContent]="content"
			></ng-container>
		</ng-container>
	</ng-container>
</main>

`,
	styleUrls: ["./book-reader.component.scss"],
	providers: [BookReaderService],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookReaderComponent {
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

	@ViewChild("scrollContainer", { read: ElementRef })
	scrollContainer?: ElementRef<HTMLElement>;

	fontSize = 20;
	BookSectionComponent = BookSectionComponent;

	constructor(
		private _library: Library,
		public _reader: BookReaderService,
	) {}
}
