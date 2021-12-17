import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";

const ROUTES: Routes = [{
	path: "examples",
	loadChildren: () =>
		import("./examples/examples.module").then(m => m.ExampleModule),
}, {
	path: "",
	pathMatch: "full",
	redirectTo: "examples",
}];

@NgModule({
	imports: [RouterModule.forRoot(ROUTES)],
	exports: [RouterModule],
})
export class AppRoutingModule {}
