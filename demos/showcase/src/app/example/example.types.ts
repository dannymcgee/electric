export type Defaults = {
	[key: string]: string | DefaultOptions;
}

interface DefaultOptions {
	value: string;
	keepAttr: boolean;
}
