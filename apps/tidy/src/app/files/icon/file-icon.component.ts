import {
	Component,
	ViewEncapsulation,
	ChangeDetectionStrategy,
	Input,
	HostBinding,
} from "@angular/core";
import { Coerce } from "@electric/ng-utils";

import EXTENSIONS from "../extensions";

@Component({
	selector: "td-file-icon",
	template: `

<img [src]="imgSrc" [alt]="type">

`,
	styleUrls: ["./file-icon.component.scss"],
	encapsulation: ViewEncapsulation.None,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FileIcon {
	static ExtMap?: Map<string, string>;

	@Input()
	get type() { return this._type; }
	set type(value) {
		this._type = value;
		this._iconId = this.getIconId(value);
	}
	private _type = "folder";
	private _iconId = "folder";

	@HostBinding("style.width.px")
	@HostBinding("style.height.px")
	@Coerce(Number)
	@Input() size = 20;

	@HostBinding("attr.role")
	readonly role = "presentation";

	get imgSrc() {
		return `assets/images/file-type-icons/${this.size}/${this._iconId}.svg`;
	}

	private getIconId(type: string) {
		if (!FileIcon.ExtMap) {
			let map = new Map<string, string>();
			for (let id of Object.keys(EXTENSIONS)) {
				let extensions = EXTENSIONS[id as keyof typeof EXTENSIONS] as readonly string[];
				for (let ext of extensions)
					map.set(ext, id);
			}

			FileIcon.ExtMap = map;
		}

		if (type === "symlink")
			return "link";

		return FileIcon.ExtMap.get(type) ?? "genericfile";
	}
}
