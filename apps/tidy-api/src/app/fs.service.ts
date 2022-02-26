import { Injectable } from "@nestjs/common";
import { promises as fs } from "fs";
import { Entry } from "./types";

@Injectable()
export class FileSystemService {
	async list(dir: string): Promise<Entry[]> {
		let entries = await fs.readdir(dir, { withFileTypes: true });

		return Promise.all(entries.map(async ent => {
			try {
				let type: "file"|"folder";
				if (ent.isFile())
					type = "file";
				else if (ent.isDirectory())
					type = "folder";
				else
					return null;

				let basename = ent.name;
				let path = `${dir}/${ent.name}`;
				let stat = await fs.stat(path);

				return {
					type,
					path,
					basename,
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
