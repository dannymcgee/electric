import { Component } from "@angular/core";
import { createHostFactory, SpectatorHost } from "@ngneat/spectator/jest";

import { ICONS } from "@electric/style";
import { $, html, VirtualKeyboard } from "@electric/testing";

import { IconModule } from "../../icon";
import { MenuModule } from "../menu.module";
import { MenubarComponent } from "./menubar.component";

@Component({})
class MenubarHostComponent {}

type Spectator = SpectatorHost<MenubarComponent, MenubarHostComponent>;

describe("Menubar", () => {
	let spec: Spectator;
	let menubarElement: HTMLElement;
	let keyboard: VirtualKeyboard<Spectator>;

	let createHost = createHostFactory({
		host: MenubarHostComponent,
		component: MenubarComponent,
		imports: [
			IconModule.withIcons(ICONS),
			MenuModule,
		]
	});

	beforeEach(() => {
		spec = createHost(html`
			<elx-menubar>
				<elx-menuitem class="foo" [elxMenuTriggerFor]="fooMenu">
					Foo
				</elx-menuitem>
				<elx-menuitem class="bar" [elxMenuTriggerFor]="barMenu">
					Bar
				</elx-menuitem>
				<elx-menuitem class="baz" [elxMenuTriggerFor]="bazMenu">
					Baz
				</elx-menuitem>
			</elx-menubar>

			<elx-menu #fooMenu class="foo-menu">
				<elx-menuitem class="foo-foo">
					Foo Foo
				</elx-menuitem>
				<elx-menuitem class="foo-bar" [elxSubmenuTriggerFor]="foobarMenu">
					Foo Bar
				</elx-menuitem>
				<elx-menuitem class="foo-baz">
					Foo Baz
				</elx-menuitem>
			</elx-menu>

			<elx-menu #foobarMenu class="foobar-menu">
				<elx-menuitem class="foobar-foo">
					Foobar Foo
				</elx-menuitem>
				<elx-menuitem class="foobar-bar">
					Foobar Bar
				</elx-menuitem>
				<elx-menuitem class="foobar-baz">
					Foobar Baz
				</elx-menuitem>
			</elx-menu>

			<elx-menu #barMenu class="bar-menu">
				<elx-menuitem class="bar-foo">
					Bar Foo
				</elx-menuitem>
				<elx-menuitem class="bar-bar">
					Bar Bar
				</elx-menuitem>
				<elx-menuitem class="bar-baz">
					Bar Baz
				</elx-menuitem>
			</elx-menu>

			<elx-menu #bazMenu class="baz-menu">
				<elx-menuitem class="baz-foo">
					Baz Foo
				</elx-menuitem>
				<elx-menuitem class="baz-bar">
					Baz Bar
				</elx-menuitem>
				<elx-menuitem class="baz-baz">
					Baz Baz
				</elx-menuitem>
			</elx-menu>
		`);

		menubarElement = spec.element;
		keyboard = new VirtualKeyboard(spec);
	});

	// Validate the testing setup
	it("should pass sanity check", () => {
		expect(spec.component).toExist();
		expect(menubarElement).toExist();
	});

	it("should have the correct ARIA role", () => {
		expect(menubarElement).toHaveAttribute("role", "menubar");
	});

	it("should forward user focus to its first menu trigger", async () => {
		spec.focus(menubarElement);
		await spec.hostFixture.whenStable();

		expect($(".foo")).toBeFocused();
	});

	it("should cycle the focused trigger when pressing <-/-> while focused",
	async () => {
		spec.focus(menubarElement);
		await spec.hostFixture.whenStable();
		expect($(".foo")).toBeFocused();

		await keyboard.press("ArrowRight");
		expect($(".bar")).toBeFocused();

		await keyboard.press("ArrowRight");
		expect($(".baz")).toBeFocused();

		await keyboard.press("ArrowRight");
		expect($(".foo")).toBeFocused();

		await keyboard.press("ArrowLeft");
		expect($(".baz")).toBeFocused();

		await keyboard.press("ArrowLeft");
		expect($(".bar")).toBeFocused();
	});

	it("should switch the open menu when mousing over items while a menu is open",
	async () => {
		spec.dispatchMouseEvent($(".foo")!, "mouseenter");
		spec.click($(".foo")!);
		await spec.hostFixture.whenStable();

		expect($("elx-menu-panel.foo-menu")).toExist();

		spec.dispatchMouseEvent($(".bar")!, "mouseenter");
		await spec.hostFixture.whenStable();

		expect($("elx-menu-panel.foo-menu")).not.toExist();
		expect($("elx-menu-panel.bar-menu")).toExist();

		spec.dispatchMouseEvent($(".baz")!, "mouseenter");
		await spec.hostFixture.whenStable();

		expect($("elx-menu-panel.bar-menu")).not.toExist();
		expect($("elx-menu-panel.baz-menu")).toExist();
	});

	it("should switch the open menu when pressing <-/-> while a menu is open",
	async () => {
		spec.focus(menubarElement);
		await spec.hostFixture.whenStable();
		expect($(".foo")).toBeFocused();

		await keyboard.press("ArrowDown");
		expect($("elx-menu-panel.foo-menu")).toExist();

		await keyboard.press("ArrowRight");
		expect($("elx-menu-panel.foo-menu")).not.toExist();
		expect($("elx-menu-panel.bar-menu")).toExist();

		await keyboard.press("ArrowRight");
		expect($("elx-menu-panel.bar-menu")).not.toExist();
		expect($("elx-menu-panel.baz-menu")).toExist();

		await keyboard.press("ArrowLeft");
		expect($("elx-menu-panel.baz-menu")).not.toExist();
		expect($("elx-menu-panel.bar-menu")).toExist();
	});

	it("should open a submenu instead of switching the open menu if -> is pressed "
		+ "while a submenu trigger is focused, and close the open submenu when <- "
		+ "is pressed while a submenu is opened",
	async () => {
		spec.focus(menubarElement);

		await keyboard.press("ArrowDown");  // ↓  Foo Foo
		await keyboard.press("ArrowDown");  // ↓  Foo Bar
		await keyboard.press("ArrowRight"); // -> Foobar Foo

		expect($("elx-menu-panel.foo-menu")).toExist();
		expect($("elx-menu-panel.foobar-menu")).toExist();
		expect($(".foobar-foo")).toBeFocused();

		await keyboard.press("ArrowRight"); // -> Bar Foo

		expect($("elx-menu-panel.foo-menu")).not.toExist();
		expect($("elx-menu-panel.foobar-menu")).not.toExist();
		expect($("elx-menu-panel.bar-menu")).toExist();
		expect($(".bar-foo")).toBeFocused();

		await keyboard.press("ArrowLeft");  // <- Foo Foo
		await keyboard.press("ArrowDown");  // ↓  Foo Bar
		await keyboard.press("ArrowRight"); // -> Foobar Foo

		expect($("elx-menu-panel.bar-menu")).not.toExist();
		expect($("elx-menu-panel.foo-menu")).toExist();
		expect($("elx-menu-panel.foobar-menu")).toExist();
		expect($(".foobar-foo")).toBeFocused();

		await keyboard.press("ArrowDown");  // ↓ Foobar Bar
		await keyboard.press("ArrowDown");  // ↓ Foobar Baz

		expect($("elx-menu-panel.foo-menu")).toExist();
		expect($("elx-menu-panel.foobar-menu")).toExist();
		expect($(".foobar-baz")).toBeFocused();

		await keyboard.press("ArrowLeft");  // <- Foo Bar

		expect($("elx-menu-panel.foobar-menu")).not.toExist();
		expect($("elx-menu-panel.foo-menu")).toExist();
		expect($(".foo-bar")).toBeFocused();

		await keyboard.press("ArrowLeft");  // <- Baz Foo

		expect($("elx-menu-panel.foo-menu")).not.toExist();
		expect($("elx-menu-panel.baz-menu")).toExist();
		expect($(".baz-foo")).toBeFocused();
	});
});
