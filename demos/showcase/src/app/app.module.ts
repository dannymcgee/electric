import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";

import { AppShellModule } from "@electric/components/app-shell";
import { ButtonModule } from "@electric/components/button";
import {
	FunctionNode,
	GraphModule,
	PortType,
} from "@electric/components/graph";
import { IconModule } from "@electric/components/icon";
import { MenuModule } from "@electric/components/menu";
import { ResizeHandleModule } from "@electric/components/resize-handle";
import { PlatformModule } from "@electric/platform";
import {
	ThemeModule,
	DEFAULT_THEME,
	ThemeService,
} from "@electric/components/theme";
import { ICONS } from "@electric/style";

import { ENV_PLATFORM } from "../environments/env-platform";
import { AppComponent } from "./app.component";
import { AppRoutingModule } from "./app.routes";
import { NavComponent } from './nav/nav.component';

@NgModule({
	imports: [
		// Angular modules
		BrowserModule,
		BrowserAnimationsModule,
		FormsModule,
		// Electric modules
		AppShellModule,
		ButtonModule,
		GraphModule.withLibrary({
			types: [{
				type: PortType.Main,
				color: "#FFFFFFF",
			}, {
				type: "float",
				color: "#00E676",
			}, {
				type: "int",
				color: "#1DE9B6",
			}, {
				type: "bool",
				color: "#F06292",
			}, {
				type: "vector",
				color: "#FFC744",
			}, {
				type: "object",
				color: "#2196F3",
			}],
			nodes: {
				add_int: {
					displayName: "Add (int)",
					type: FunctionNode,
					inputs: [{
						name: "LHS",
						type: "int",
					}, {
						name: "RHS",
						type: "int",
					}],
					outputs: [{
						name: "Result",
						type: "int",
					}],
				},
				add_float: {
					displayName: "Add (float)",
					type: FunctionNode,
					inputs: [{
						name: "LHS",
						type: "float",
					}, {
						name: "RHS",
						type: "float",
					}],
					outputs: [{
						name: "Result",
						type: "float",
					}],
				},
				add_int_float: {
					displayName: "Add (int, float)",
					type: FunctionNode,
					inputs: [{
						name: "LHS",
						type: "int",
					}, {
						name: "RHS",
						type: "float",
					}],
					outputs: [{
						name: "Result",
						type: "float",
					}],
				},
				is_even_int: {
					displayName: "Is Even? (int)",
					type: FunctionNode,
					inputs: [{
						name: "Value",
						type: "int",
					}],
					outputs: [{
						name: "Result",
						type: "bool",
					}],
				},
				is_even_float: {
					displayName: "Is Even? (float)",
					type: FunctionNode,
					inputs: [{
						name: "Value",
						type: "float",
					}],
					outputs: [{
						name: "Result",
						type: "bool",
					}],
				},
			},
		}),
		IconModule.withIcons(ICONS),
		MenuModule,
		PlatformModule.forPlatform(ENV_PLATFORM),
		ResizeHandleModule,
		ThemeModule.withTheme(DEFAULT_THEME, "dark"),
		// Routing
		AppRoutingModule,
	],
	declarations: [
		AppComponent,
		NavComponent,
	],
	bootstrap: [
		AppComponent,
	],
})
export class AppModule {
	constructor (private _: ThemeService) {}
}
