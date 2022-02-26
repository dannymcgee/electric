export interface EntryMeta {
	path: string;
	basename: string;
	size: number;
	hidden: boolean;
	created: number;
	lastAccessed: number;
	lastModified: number;
	lastChanged: number;
}

export type Entry = FileEntry | FolderEntry;

export interface FileEntry extends EntryMeta {
	type: "file";
}

export interface FolderEntry extends EntryMeta {
	type: "folder";
	children?: Entry[];
}
