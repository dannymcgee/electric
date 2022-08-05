import { ComponentFixture, TestBed } from "@angular/core/testing";

import { NavPointComponent } from "./nav-point.component";

describe("NavPointComponent", () => {
	let component: NavPointComponent;
	let fixture: ComponentFixture<NavPointComponent>;

	beforeEach(async () => {
		await TestBed
			.configureTestingModule({
				declarations: [NavPointComponent]
			})
			.compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(NavPointComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", () => {
		expect(component).toBeTruthy();
	});
});
