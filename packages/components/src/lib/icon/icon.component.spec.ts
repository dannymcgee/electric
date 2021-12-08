import { SpectatorHost, createHostFactory } from "@ngneat/spectator/jest";

import { a11y, ICONS } from "@electric/style";
import { html } from "@electric/utils";

import { IconModule } from "./icon.module";
import { IconComponent } from './icon.component';

describe("IconComponent", () => {
	let spectator: SpectatorHost<IconComponent>;
	let createHost = createHostFactory({
		component: IconComponent,
		imports: [IconModule.withIcons(ICONS)],
		declareComponent: false,
	});

	it("should render the icon", () => {
		spectator = createHost(html`
			<elx-icon icon="More"></elx-icon>
		`);

		expect(spectator.element).toExist();
		expect(spectator.element).toHaveDescendant("svg");
	});

	it("should support size", () => {
		spectator = createHost(html`
			<elx-icon icon="More" size="lg"></elx-icon>
		`);

		expect(spectator.element).toHaveStyle({ fontSize: a11y.rem(24) });
	});

	it("should support dynamic classes", () => {
		let spectator = createHost(html`
			<elx-icon [icon]="icon"></elx-icon>
		`, {
			hostProps: { icon: "More" },
		});
		spectator.detectComponentChanges();
		expect(spectator.element).toHaveClass("elx-icon--more");

		spectator.setHostInput({ icon: "ChevronRightSmall" });
		expect(spectator.element).toHaveClass(`elx-icon--chevron-right-small`);
		expect(spectator.element).not.toHaveClass("elx-icon--more");
	});
});
