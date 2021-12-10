import { SpectatorHost, createHostFactory } from "@ngneat/spectator/jest";

import { html } from "@electric/testing";

import { FormControlsModule } from "../form-controls.module";
import { FormFieldComponent } from "./form-field.component";

type Spectator = SpectatorHost<FormFieldComponent<any>>;

describe("FormFieldComponent", () => {
	let spec: Spectator;

	let createHost = createHostFactory({
		component: FormFieldComponent,
		imports: [FormControlsModule],
		declareComponent: false,
	});

	beforeEach(() => {
		spec = createHost(html`
			<elx-form-field>
				<elx-label>Label</elx-label>
				<input elx-input />
			</elx-form-field>
		`);
	});

	// Validate the testing setup
	it("should pass sanity check", () => {
		expect(spec.component).toExist();
	});

	it("should link a child label and form control to one another with "
		+ "`for`/`id` attributes",
	async () => {
		await spec.fixture.whenStable();
		spec.detectChanges();

		let label = spec.query<HTMLLabelElement>("label")!;
		let input = spec.query<HTMLInputElement>("input")!;

		// Verify the elements exist
		expect(label).toExist();
		expect(input).toExist();

		// Verify the attributes and properties both exist
		// (and aren't set to literal "null"/"undefined" strings)
		expect(label).toHaveAttribute("for");
		expect(label.htmlFor).toBeTruthy();
		expect(label.getAttribute("for")).not.toMatch(/(null|undefined)/i);

		expect(input).toHaveAttribute("id");
		expect(input.id).toBeTruthy();
		expect(input.getAttribute("id")).not.toMatch(/(null|undefined)/i);

		// Verify the attributes and properties match each other
		expect(label.getAttribute("for")).toEqual(input.getAttribute("id"));
		expect(label.htmlFor).toMatch(label.getAttribute("for")!);
		expect(label.htmlFor).toMatch(input.id);
	})
});
