import { Opt } from "@electric/utils";
import * as os from "@tauri-apps/api/os";
import { invoke } from "@tauri-apps/api/tauri";

// eslint-disable-next-line @typescript-eslint/no-namespace
namespace tauri {
	let _platform: Opt<Promise<os.Platform>> = null;

	export function parseFontToXml(fontPath: string): Promise<string> {
		return invoke("parse_font_to_xml", { fontPath });
	}

	export function pathExists(pathname: string): Promise<boolean> {
		return invoke("path_exists", { pathname });
	}

	export function platform(): Promise<os.Platform> {
		return _platform ??= os.platform();
	}
}
export default tauri;
