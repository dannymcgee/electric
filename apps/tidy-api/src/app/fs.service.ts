import { Injectable } from "@nestjs/common";
import { promises as fs } from "fs";
import * as path from "path";
import { isHiddenFile } from "is-hidden-file";
import { Entry } from "./types";

@Injectable()
export class FileSystemService {
	async list(dir: string): Promise<Entry[]> {
		let entries = await fs.readdir(dir, { withFileTypes: true });

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
				let stat = await fs.stat(absPath);

				return {
					type,
					path: absPath,
					basename: ent.name,
					hidden: isHiddenFile(absPath),
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
