import { invoke } from "@tauri-apps/api";

namespace tauri {
	export function importBook(path: string): Promise<string> {
		return invoke("import_book", { path });
	}
	export function isDirectory(path: string): Promise<boolean> {
		return invoke("is_directory", { path });
	}
}
export default tauri;
