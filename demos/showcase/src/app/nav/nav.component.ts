import { Component, HostBinding } from "@angular/core";

import { Vec2 } from "@electric/components/resize-handle";
import { anim } from "@electric/style";

import { ROUTES } from "../examples/routes/examples.routes";

interface ExampleRoute {
	path: string;
	name: string;
}

@Component({
	selector: "showcase-nav",
	template: `

<a *ngFor="let route of routes"
	class="nav-item"
	role="link"
	routerLink="/examples/{{ route.path }}"
	routerLinkActive="active"
>
	{{ route.name }}
</a>

<elx-resize-handle
	class="resize-handle"
	direction="horizontal"
	align="right"
	(move)="resize($event)"
></elx-resize-handle>

	`,
	styleUrls: ["./nav.component.scss"],
})
export class NavComponent {
	@HostBinding("attr.role")
	readonly role = "navigation";

	@HostBinding("style.width.px")
	width = 256;

	routes = ROUTES.flatMap(root =>
		root.children
			.filter(isExampleRoute)
			.map(route => ({
				path: route.path,
				name: route.name,
			}))
	) as ExampleRoute[];

	resize(event: Vec2): void {
		let updated = this.width + event.x;
		this.width = anim.clamp(updated, [128, 512]);
	}
}

function isExampleRoute(route: unknown): route is ExampleRoute {
	return (
		typeof route === "object"
		&& route != null
		&& "path" in route
		&& "name" in route
	);
}
