import { Component } from "@angular/core";
import { createHostFactory, SpectatorHost } from "@ngneat/spectator/jest";

import { $, $$, html, keyboard } from "@electric/utils";

import { MenuComponent } from "./menu.component";
import { MenuModule } from "./menu.module";

type Spectator = SpectatorHost<MenuComponent, MenuHostComponent>;

@Component({})
class MenuHostComponent {
	foo(): void {}
	bar(): void {}
	baz(): void {}
}

describe("Menu", () => {
	let spec: Spectator;
	let triggerElement: HTMLElement;

	let createHost = createHostFactory({
		host: MenuHostComponent,
		component: MenuComponent,
		imports: [MenuModule],
		declareComponent: false,
	});

	beforeEach(() => {
		spec = createHost(html`
			<button id="trigger" [elxMenuTriggerFor]="menu">
				Open Menu
			</button>

			<elx-menu #menu class="my-menu">
				<elx-menuitem (click)="foo()">Foo</elx-menuitem>
				<elx-menuitem (click)="bar()">Bar</elx-menuitem>
				<elx-menuitem (click)="baz()">Baz</elx-menuitem>
			</elx-menu>
		`);

		triggerElement = spec.queryHost("#trigger")!;
	});

	// Validate the testing setup
	it("should pass sanity check", () => {
		expect(spec.component).toExist();
		expect(triggerElement).toExist();
	});

	it("should toggle open/closed when its trigger is clicked", async () => {
		spec.dispatchMouseEvent(triggerElement, "mouseenter");
		spec.click(triggerElement);
		await spec.hostFixture.whenStable();

		expect($("elx-menu-panel")).toExist();
		expect($$("elx-menuitem")).toHaveLength(3);

		for (let item of $$("elx-menuitem")) {
			expect($("elx-menu-panel")).toHaveDescendant(item);
		}

		expect($$("elx-menuitem")[0]).toHaveText("Foo");
		expect($$("elx-menuitem")[1]).toHaveText("Bar");
		expect($$("elx-menuitem")[2]).toHaveText("Baz");

		spec.click(triggerElement);
		await spec.hostFixture.whenStable();

		expect($("elx-menu-panel")).not.toExist();
	});

	it("should assign correct ARIA attributes to elements", async () => {
		expect(triggerElement).toHaveAttribute("aria-haspopup", "menu");

		spec.dispatchMouseEvent(triggerElement, "mouseenter");
		spec.click(triggerElement);
		await spec.hostFixture.whenStable();

		expect(triggerElement).toHaveAttribute("aria-expanded", "true");

		expect($("elx-menu-panel")).toExist();
		expect($("elx-menu-panel")).toHaveAttribute("role", "menu");
		expect($$("elx-menuitem")).toHaveLength(3);

		for (let item of $$("elx-menuitem")) {
			expect($("elx-menu-panel")).toHaveDescendant(item);
			expect(item).toHaveAttribute("role", "menuitem");
		}
	});

	it("should open and focus the first item when ArrowDown is pressed on the trigger",
	async () => {
		spec.focus(triggerElement);
		await keyboard.press("ArrowDown", spec);

		expect($$("elx-menuitem")[0]).toHaveText("Foo");
		expect($$("elx-menuitem")[0]).toBeFocused();
	});

	it("should open and focus the last item when ArrowUp is pressed on the trigger",
	async () => {
		spec.focus(triggerElement);
		await keyboard.press("ArrowUp", spec);

		expect($$("elx-menuitem")[2]).toHaveText("Baz");
		expect($$("elx-menuitem")[2]).toBeFocused();
	});

	it("should cycle the focused item when ArrowDown is pressed in the menu",
	async () => {
		spec.focus(triggerElement);
		await keyboard.press("ArrowDown", spec);

		expect($$("elx-menuitem")[0]).toHaveText("Foo");
		expect($$("elx-menuitem")[1]).toHaveText("Bar");
		expect($$("elx-menuitem")[2]).toHaveText("Baz");

		expect($$("elx-menuitem")[0]).toBeFocused();

		await keyboard.press("ArrowDown", spec);
		expect($$("elx-menuitem")[1]).toBeFocused();

		await keyboard.press("ArrowDown", spec);
		expect($$("elx-menuitem")[2]).toBeFocused();

		await keyboard.press("ArrowDown", spec);
		expect($$("elx-menuitem")[0]).toBeFocused();
	});

	it("should cycle the focused item when ArrowUp is pressed in the menu",
	async () => {
		spec.focus(triggerElement);
		await keyboard.press("ArrowUp", spec);

		expect($$("elx-menuitem")[0]).toHaveText("Foo");
		expect($$("elx-menuitem")[1]).toHaveText("Bar");
		expect($$("elx-menuitem")[2]).toHaveText("Baz");
		expect($$("elx-menuitem")[2]).toBeFocused();

		await keyboard.press("ArrowUp", spec);
		expect($$("elx-menuitem")[1]).toBeFocused();

		await keyboard.press("ArrowUp", spec);
		expect($$("elx-menuitem")[0]).toBeFocused();

		await keyboard.press("ArrowUp", spec);
		expect($$("elx-menuitem")[2]).toBeFocused();
	});

	it("should close the menu and re-focus the trigger when Esc is pressed",
	async () => {
		spec.focus(triggerElement);
		await keyboard.press("ArrowDown", spec);

		expect($("elx-menu-panel")).toExist();
		expect($$("elx-menuitem")[0]).toBeFocused();

		await keyboard.press("Escape", spec);
		spec.detectChanges();

		expect($("elx-menu-panel")).not.toExist();
		expect(triggerElement).toBeFocused();
	});

	it("should invoke event handlers and close the menu when an item is pressed",
	async () => {
		let spies = [
			jest.spyOn(spec.hostComponent, "foo"),
			jest.spyOn(spec.hostComponent, "bar"),
			jest.spyOn(spec.hostComponent, "baz"),
		];

		for (let i = 0; i < 3; i++) {
			spec.dispatchMouseEvent(triggerElement, "mouseenter");
			spec.click(triggerElement);
			await spec.hostFixture.whenStable();

			spec.click($$("elx-menuitem")[i]);
			await spec.hostFixture.whenStable();

			expect(spies[i]).toHaveBeenCalledTimes(1);
			expect($("elx-menu-panel")).not.toExist();
		}
	});

	it("should forward user classes added to the `elx-menu` to the `elx-menu-panel`",
	() => {
		spec.dispatchMouseEvent(triggerElement, "mouseenter");
		spec.click(triggerElement);

		expect($("elx-menu-panel")).toHaveClass("my-menu");
	});
});
