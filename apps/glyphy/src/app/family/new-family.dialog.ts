import { Component, Directive, EventEmitter, Input, Output, TrackByFunction } from "@angular/core";
import { AbstractControl, AsyncValidator, NG_ASYNC_VALIDATORS } from "@angular/forms";
import * as dialog from "@tauri-apps/api/dialog";
import * as fs from "@tauri-apps/api/fs";

import tauri from "../tauri.bridge";
import { NewFont } from "../font/new-font";
import { NewFontFamily } from "./family.types";

class NewFontFromForm extends NewFont {
	constructor (
		weight: number,
		weightName: string,
		style: "" | "Italic",

		public checked: boolean,
	) {
		super(weight, weightName, style);
	}
}

@Component({
	selector: "g-new-family-dialog",
	templateUrl: "./new-family.dialog.html",
	styleUrls: ["./new-family.dialog.scss"],
})
export class NewFamilyDialog {
	@Output() cancel = new EventEmitter<void>();
	@Output() confirm = new EventEmitter<[NewFontFamily, NewFont[]]>();

	private _parentDirectory = "";
	get parentDirectory() { return this._parentDirectory; }
	set parentDirectory(value) {
		this._parentDirectory = value;
		this.updateDirectory();
	}

	private _name = "";
	get name() { return this._name; }
	set name(value) {
		this._name = value;
		this.updateDirectory();
	}

	directory = "";

	fonts = [
		new NewFontFromForm(100, "Thin", "", false),
		new NewFontFromForm(100, "Thin", "Italic", false),
		new NewFontFromForm(200, "ExtraLight", "", false),
		new NewFontFromForm(200, "ExtraLight", "Italic", false),
		new NewFontFromForm(300, "Light", "", false),
		new NewFontFromForm(300, "Light", "Italic", false),
		new NewFontFromForm(400, "Regular", "", true),
		new NewFontFromForm(400, "Regular", "Italic", true),
		new NewFontFromForm(500, "Medium", "", false),
		new NewFontFromForm(500, "Medium", "Italic", false),
		new NewFontFromForm(600, "SemiBold", "", false),
		new NewFontFromForm(600, "SemiBold", "Italic", false),
		new NewFontFromForm(700, "Bold", "", true),
		new NewFontFromForm(700, "Bold", "Italic", true),
		new NewFontFromForm(800, "ExtraBold", "", false),
		new NewFontFromForm(800, "ExtraBold", "Italic", false),
		new NewFontFromForm(900, "Black", "", false),
		new NewFontFromForm(900, "Black", "Italic", false),
	];

	trackByIndex: TrackByFunction<NewFont> = idx => idx;

	async selectParentFolder(control: AbstractControl) {
		try {
			const result = await dialog.open({
				title: "Choose or Create a parent directory",
				directory: true,
				multiple: false,
			}) as string | null;

			if (result) {
				console.log("directory selected:", result);
				this.parentDirectory = result;
			}

			control.markAsTouched();
		}
		catch (err) {
			console.error(err);
		}
	}

	onSubmit(_value: any): void {
		this.confirm.emit([
			new NewFontFamily(this.name, this.directory),
			this.fonts.filter(font => font.checked),
		]);
	}

	private updateDirectory(): void {
		if (!this.parentDirectory) {
			this.directory = "";
			return;
		}

		this.directory = [
			this.parentDirectory.replace(/\\/g, "/"),
			this.name.replace(/\s/g, ""),
		].join("/");
	}
}

// TODO: Move this somewhere else
@Directive({
	selector: "[gParentFolderExists]",
	providers: [{
		provide: NG_ASYNC_VALIDATORS,
		useExisting: ParentFolderExistsValidator,
		multi: true,
	}],
})
export class ParentFolderExistsValidator implements AsyncValidator {
	async validate(control: AbstractControl) {
		if (!control.value) return null;

		const pathname = control.value as string;
		const segments = pathname.split(/[\/\\]/g).filter(Boolean);
		segments.pop();
		const parentPathname = segments.join("/");

		if (!(await tauri.pathExists(parentPathname)))
			return {
				parentFolderExists: `Parent directory "${parentPathname}" does not exist.`,
			};

		return null;
	}
}

// TODO: Move this somewhere else
@Directive({
	selector: "[gTargetFolderIsNew]",
	providers: [{
		provide: NG_ASYNC_VALIDATORS,
		useExisting: TargetFolderIsNewValidator,
		multi: true,
	}],
})
export class TargetFolderIsNewValidator implements AsyncValidator {
	@Input("gTargetFolderIsNew")
	options?: {
		allowEmpty?: boolean;
	};

	async validate(control: AbstractControl) {
		if (!control.value) return null;

		const pathname = control.value as string;
		if (await tauri.pathExists(pathname)) {
			if (this.options?.allowEmpty) {
				const children = await fs.readDir(pathname);
				if (!children.length)
					return null;
			}
			return {
				targetFolderIsNew: `Target directory "${pathname}" already exists.`,
			};
		}

		return null;
	}
}
