import { match } from "@electric/utils";
import { Injectable } from "@nestjs/common";
import fs from "node:fs";
import os from "node:os";
import * as path from "node:path";
import type { Attrs as WinAttrs } from "winattr";

import { Entry } from "./types";

@Injectable()
export class FileSystemService {
	async list(dir: string): Promise<Entry[]> {
		let entries = await fs.promises.readdir(dir, { withFileTypes: true });

		return Promise.all(entries.map(async ent => {
			try {
				let type: "file"|"folder"|"symlink";
				if (ent.isFile())
					type = "file";
				else if (ent.isDirectory())
					type = "folder";
				else if (ent.isSymbolicLink())
					type = "symlink";
				else
					return null;

				let absPath = path.join(dir, ent.name);
				let stat = await fs.promises.stat(absPath);

				return {
					type,
					path: absPath,
					basename: ent.name,
					hidden: await isHiddenFile(absPath),
					size: stat.size,
					created: stat.birthtimeMs,
					lastAccessed: stat.atimeMs,
					lastModified: stat.mtimeMs,
					lastChanged: stat.ctimeMs,
				}
			}
			catch (err) {
				console.error(err.message);
				return null;
			}
		}));
	}
}

function isHiddenFile(filepath: string) {
	return match (os.platform(), {
		"win32": async () => {
			const winattr = await import("winattr");
			const attrs = await new Promise<WinAttrs>((resolve, reject) => {
				winattr.get(filepath, (err, attrs) => {
					if (err) reject(err);
					else resolve(attrs);
				});
			});

			return attrs.hidden;
		},
		_: async () => path.basename(filepath).startsWith("."),
	});
}
