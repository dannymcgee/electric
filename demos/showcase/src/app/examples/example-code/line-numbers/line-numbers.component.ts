import { ChangeDetectionStrategy, Component, Input } from "@angular/core";

@Component({
	selector: "ol[showcaseLineNumbersFor]",
	template: `

@for (_ of lines; track $index) {
	<li class="line-number"></li>
}

	`,
	styleUrls: ["./line-numbers.component.scss"],
	changeDetection: ChangeDetectionStrategy.OnPush,
	standalone: false,
})
export class LineNumbersComponent {
	@Input("showcaseLineNumbersFor")
	lines: string[] = [];
}
