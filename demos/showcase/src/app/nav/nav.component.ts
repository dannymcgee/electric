import { Component, HostBinding } from "@angular/core";

import { Vec2 } from "@electric/components/resize-handle";
import { anim } from "@electric/style";

import { ROUTES } from "../examples/routes/examples.routes";

interface ExampleRoute {
	path: string;
	data: { name: string };
}

@Component({
	selector: "showcase-nav",
	template: `

@for (route of routes; track route.path) {
	<a class="nav-item"
		role="link"
		routerLink="/examples/{{ route.path }}"
		routerLinkActive="active"
	>
		{{ route.data.name }}
	</a>
}

<elx-resize-handle
	class="resize-handle"
	direction="horizontal"
	align="right"
	(move)="resize($event)"
/>

	`,
	styleUrls: ["./nav.component.scss"],
	standalone: false,
})
export class NavComponent {
	@HostBinding("attr.role")
	readonly role = "navigation";

	@HostBinding("style.width.px")
	width = 256;

	routes = ROUTES.flatMap(root =>
		root.children
			?.filter(isExampleRoute)
			.map(route => ({
				path: route.path,
				data: route.data,
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
		&& "data" in route
		&& route.data != null
		&& typeof route.data === "object"
		&& "name" in route.data
		&& typeof route.data.name === "string"
	);
}
