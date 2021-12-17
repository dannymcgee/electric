import { ChangeDetectionStrategy, Component, Input } from "@angular/core";

@Component({
	selector: "ol[showcaseLineNumbersFor]",
	template: `

<li class="line-number"
	*ngFor="let _ of lines"
></li>

	`,
	styleUrls: ["./line-numbers.component.scss"],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LineNumbersComponent {
	@Input("showcaseLineNumbersFor")
	lines: string[] = [];
}
