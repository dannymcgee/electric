import { Component } from "@angular/core";
import { createHostFactory, SpectatorHost } from "@ngneat/spectator/jest";

import { ICONS } from "@electric/style";
import { sleep } from "@electric/utils";
import { $, $$, html, VirtualKeyboard } from "@electric/testing";

import { IconModule } from "../icon";
import { MenuComponent } from "./menu.component";
import { MenuModule } from "./menu.module";

type Spectator = SpectatorHost<MenuComponent, MenuHostComponent>;

@Component({ standalone: false })
class MenuHostComponent {
	foo(): void {}
	bar(): void {}
	lorem(): void {}
	ipsum(): void {}
	dolor(): void {}
}

describe("Submenu", () => {
	let spec: Spectator;
	let triggerElement: HTMLElement;
	let keyboard: VirtualKeyboard<Spectator>;

	let createHost = createHostFactory({
		host: MenuHostComponent,
		component: MenuComponent,
		imports: [
			IconModule.withIcons(ICONS),
			MenuModule,
		],
		declareComponent: false,
	});

	beforeEach(() => {
		spec = createHost(html`
			<button id="trigger" [elxMenuTriggerFor]="menu">
				Open Menu
			</button>

			<elx-menu #menu>
				<elx-menuitem (click)="foo()">
					Foo
				</elx-menuitem>
				<elx-menuitem (click)="bar()">
					Bar
				</elx-menuitem>
				<elx-menuitem [elxSubmenuTriggerFor]="submenu">
					Baz
				</elx-menuitem>
			</elx-menu>

			<elx-menu #submenu>
				<elx-menuitem (click)="lorem()">
					Lorem
				</elx-menuitem>
				<elx-menuitem (click)="ipsum()">
					Ipsum
				</elx-menuitem>
				<elx-menuitem (click)="dolor()">
					Dolor
				</elx-menuitem>
			</elx-menu>
		`);

		triggerElement = spec.queryHost("#trigger")!;
		keyboard = new VirtualKeyboard(spec);
	});

	// Validate the testing setup
	it("should pass sanity check", () => {
		expect(spec.component).toExist();
		expect(triggerElement).toExist();
	});

	it("should open after a 250ms delay when its trigger is hovered",
	async () => {
		spec.dispatchMouseEvent(triggerElement, "mouseenter");
		spec.click(triggerElement);

		let submenuTriggerElement = $$("elx-menuitem")[2];
		// NOTE: We need to dispatch this event twice because Jest's vdom doesn't
		// implement HTMLElement.matches(selector), which is used by the
		// SubmenuController.openEvents$ implementation to catch the initial
		// mouseenter event. Leaky abstractions ftw
		spec.dispatchMouseEvent(submenuTriggerElement, "mouseenter");
		spec.dispatchMouseEvent(submenuTriggerElement, "mouseenter");

		await sleep(250);

		let submenu = $$("elx-menu-panel")[1];
		let submenuItems = $$(submenu, "elx-menuitem");
		expect(submenuItems).toHaveLength(3);
		expect(submenuItems[0]).toHaveText("Lorem");
		expect(submenuItems[1]).toHaveText("Ipsum");
		expect(submenuItems[2]).toHaveText("Dolor");
	});

	it("should open when its trigger is clicked", () => {
		spec.dispatchMouseEvent(triggerElement, "mouseenter");
		spec.click(triggerElement);

		let submenuTriggerElement = $$("elx-menuitem")[2];
		spec.dispatchMouseEvent(submenuTriggerElement, "mouseenter");
		spec.click(submenuTriggerElement);

		let submenu = $$("elx-menu-panel")[1];
		let submenuItems = $$(submenu, "elx-menuitem");
		expect(submenuItems).toHaveLength(3);
		expect(submenuItems[0]).toHaveText("Lorem");
		expect(submenuItems[1]).toHaveText("Ipsum");
		expect(submenuItems[2]).toHaveText("Dolor");
	});

	it("should open when -> is pressed on its trigger", async () => {
		spec.focus(triggerElement);
		await keyboard.press("ArrowDown");  // Open menu
		await keyboard.press("ArrowDown");  // ↓ Bar
		await keyboard.press("ArrowDown");  // ↓ Baz
		await keyboard.press("ArrowRight"); // -> Open submenu

		let submenu = $$("elx-menu-panel")[1];
		let submenuItems = $$(submenu, "elx-menuitem");
		expect(submenuItems).toHaveLength(3);
		expect(submenuItems[0]).toHaveText("Lorem");
		expect(submenuItems[1]).toHaveText("Ipsum");
		expect(submenuItems[2]).toHaveText("Dolor");
	});

	it("should close and re-focus the trigger when <- is pressed within the menu",
	async () => {
		spec.focus(triggerElement);
		await keyboard.press("ArrowDown");  // Open menu

		let submenuTrigger = $$("elx-menuitem")[2];
		await keyboard.press("ArrowDown");  // ↓ Bar
		await keyboard.press("ArrowDown");  // ↓ Baz
		await keyboard.press("ArrowRight"); // -> Open submenu

		expect($$("elx-menu-panel")[1]).toExist();

		await keyboard.press("ArrowLeft");  // <- Close submenu
		spec.detectChanges();

		expect($$("elx-menu-panel")[1]).not.toExist();
		expect(submenuTrigger).toBeFocused();
	});

	it("should close and re-focus the trigger when Esc is pressed within the menu",
	async () => {
		spec.focus(triggerElement);
		await keyboard.press("ArrowDown");  // Open menu

		let submenuTrigger = $$("elx-menuitem")[2];
		await keyboard.press("ArrowDown");  // ↓ Bar
		await keyboard.press("ArrowDown");  // ↓ Baz
		await keyboard.press("ArrowRight"); // -> Open submenu

		expect($$("elx-menu-panel")[1]).toExist();

		await keyboard.press("Escape");     // Close submenu
		spec.detectChanges();

		expect($$("elx-menu-panel")[1]).not.toExist();
		expect(submenuTrigger).toBeFocused();
	});

	it("should exhibit correct navigation behavior when arrow keys are pressed",
	async () => {
		spec.focus(triggerElement);
		await keyboard.press("ArrowUp");  // Open menu with focus on 'Baz'

		let menuItems = $$("elx-menuitem");
		let foo = menuItems[0];
		let bar = menuItems[1];
		let baz = menuItems[2];

		expect(baz).toBeFocused();

		await keyboard.press("ArrowUp");
		expect(bar).toBeFocused();

		await keyboard.press("ArrowDown");
		expect(baz).toBeFocused();

		await keyboard.press("ArrowDown");
		expect(foo).toBeFocused();

		await keyboard.press("ArrowDown");
		expect(bar).toBeFocused();

		await keyboard.press("ArrowDown");
		expect(baz).toBeFocused();

		await keyboard.press("ArrowRight");

		let submenu = $$("elx-menu-panel")[1];
		let submenuItems = $$(submenu, "elx-menuitem");
		let lorem = submenuItems[0];
		let ipsum = submenuItems[1];
		let dolor = submenuItems[2];

		expect(lorem).toBeFocused();

		await keyboard.press("ArrowDown");
		expect(ipsum).toBeFocused();

		await keyboard.press("ArrowDown");
		expect(dolor).toBeFocused();

		await keyboard.press("ArrowDown");
		expect(lorem).toBeFocused();

		await keyboard.press("ArrowUp");
		expect(dolor).toBeFocused();

		await keyboard.press("ArrowUp");
		expect(ipsum).toBeFocused();

		await keyboard.press("ArrowLeft");
		spec.detectChanges();

		expect($$("elx-menu-panel")[1]).not.toExist();
		expect(baz).toBeFocused();

		await keyboard.press("ArrowDown");
		expect(foo).toBeFocused();

		await keyboard.press("ArrowUp");
		expect(baz).toBeFocused();

		await keyboard.press("ArrowUp");
		expect(bar).toBeFocused();

		await keyboard.press("ArrowUp");
		expect(foo).toBeFocused();

		await keyboard.press("Escape");
		spec.detectChanges();

		expect($("elx-menu-panel")).not.toExist();
		expect(triggerElement).toBeFocused();
	});

	it("should invoke event handlers and close all menus when an item is pressed",
	async () => {
		let spy = jest.spyOn(spec.hostComponent, "ipsum");

		spec.dispatchMouseEvent(triggerElement, "mouseenter");
		spec.click(triggerElement);
		await spec.hostFixture.whenStable();

		let submenuTrigger = $$("elx-menuitem")[2];
		spec.dispatchMouseEvent(submenuTrigger, "mouseenter");
		spec.click(submenuTrigger);
		await spec.hostFixture.whenStable();

		let submenu = $$("elx-menu-panel")[1];
		let ipsum = $$(submenu, "elx-menuitem")[1];
		spec.click(ipsum);
		await spec.hostFixture.whenStable();
		spec.detectChanges();

		expect(spy).toHaveBeenCalledTimes(1);
		expect($("elx-menu-panel")).not.toExist();
	});
});
