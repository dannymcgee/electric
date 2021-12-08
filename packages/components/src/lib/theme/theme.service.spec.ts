import { Component } from "@angular/core";
import { createComponentFactory, Spectator } from "@ngneat/spectator";
import { COLOR_SCHEME, THEME, ThemeService } from "./theme.service";
import { ThemeDefinition } from "./theme.types";

@Component({
	template: `<p>ThemeTestingComponent works!</p>`,
})
class ThemeTestingComponent {
	constructor (private _: ThemeService) {}
}

const TEST_THEME: ThemeDefinition = {
	light: {
		colors: {
			primary: {
				500: "#000000",
			},
		},
		vars: {
			helloWorld: `"Hello, world!"`,
			fortyTwo: 42,
		},
	},
	dark: {
		colors: {
			primary: {
				500: "#ffffff",
			},
		},
		vars: {
			helloWorld: `"Hello, world!"`,
			fortyTwo: 42,
		},
	},
};

describe("ThemeService", () => {
	let spectator: Spectator<ThemeTestingComponent>;
	let service: ThemeService;
	let createComponent = createComponentFactory({
		component: ThemeTestingComponent,
		providers: [
			{ provide: THEME, useValue: TEST_THEME },
			{ provide: COLOR_SCHEME, useValue: "dark" },
			ThemeService,
		],
	});

	beforeEach(() => {
		spectator = createComponent();
		service = spectator.inject(ThemeService);
	});

	it("should create CSS properties for theme colors as RGB tuples", () => {
		let value = window
			.getComputedStyle(document.documentElement)
			.getPropertyValue("--primary-500");

		expect(value).toMatch("255, 255, 255");
	});

	it("should add theme vars to the document as CSS properties", () => {
		let styles = getComputedStyle(document.documentElement);

		let helloWorld = styles.getPropertyValue("--hello-world");
		expect(helloWorld).toMatch(`"Hello, world!"`);

		let fortyTwo = styles.getPropertyValue("--forty-two");
		expect(fortyTwo).toMatch("42");
	});

	describe("setColorScheme", () => {
		it("should update CSS properties when called", () => {
			service.setColorScheme("light");

			let value = window
				.getComputedStyle(document.documentElement)
				.getPropertyValue("--primary-500");

			expect(value).toMatch("0, 0, 0");
		});

		it("should log a warning if the color scheme doesn't exist", () => {
			let spy = jest.spyOn(console, "warn");
			service.setColorScheme("highContrast");

			expect(spy).toHaveBeenCalledWith(
				`No color scheme defined for key "highContrast"!`,
			);
		});
	});

	describe("get colorScheme", () => {
		it("should return the current scheme name", () => {
			expect(service.colorScheme).toMatch("dark");

			service.setColorScheme("light");
			spectator.detectChanges();

			expect(service.colorScheme).toMatch("light");
		});
	});

	describe("getHex", () => {
		it("should return the current value for the given color name and shade", () => {
			let value = service.getHex("primary", 500);
			expect(value).toMatch(/#ffffff/i);
		});

		it("should return an 8-digit hex value if an alpha argument is passed", () => {
			let value = service.getHex("primary", 500, 0.5);
			expect(value).toMatch(/#ffffff80/i);
		});

		it("should return `null` if an undefined color is requested", () => {
			let value = service.getHex("accent", 500);
			expect(value).toBe(null);
		});
	});
});
