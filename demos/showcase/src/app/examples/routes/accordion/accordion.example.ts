import { Component } from "@angular/core";

const INITIAL_CONTENT =
	"Lorem ipsum dolor sit amet, consectetur adipiscing elit.";

@Component({
	templateUrl: "./accordion.example.html",
	styleUrls: [
		"../example.shared.scss",
		"./accordion.example.scss",
	],
	standalone: false,
})
export class AccordionExample {
	accordionGroup = {
		multi: false,
	};

	accordions = [{
		header: "Foo",
		content: INITIAL_CONTENT,
	}, {
		header: "Bar",
		content: INITIAL_CONTENT,
	}, {
		header: "Baz",
		content: INITIAL_CONTENT,
	}];

	get controller() {
		return`
			@Component({
				// ...
			})
			export class AccordionExample {
				accordions = [
					${this.accordions.map(it => `{
						header: "${it.header}",
						content: "${it.content}",
					}`)}
				];
			}
		`;
	}

	get template() {
		let { multi } = this.accordionGroup;

		return `
			<elx-accordion-group class="accordion-group"
				${multi ? "multi" : ""}
			>
				<elx-accordion
					*ngFor="let accordion of accordions; let first = first;"
					[expanded]="first"
				>
					<elx-accordion-header>
						{{ accordion.header }}
					</elx-accordion-header>
					<p>
						{{ accordion.content }}
					</p>
				</elx-accordion>
			</elx-accordion-group>
		`;
	}

	stylesheet = `
		.accordion-group {
			width: 480px;
			max-width: 100%;
		}
	`;
}
