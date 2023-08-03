export interface Vec<N extends number> extends Array<number> {
	readonly length: N;
	push: never;
	pop: never;
	shift: never;
	unshift: never;
	splice: never;
}

export class Vector extends Array<number> {
	declare push: never;
	declare pop: never;
	declare shift: never;
	declare unshift: never;
	declare splice: never;
}

delete Vector.prototype.push;
delete Vector.prototype.pop;
delete Vector.prototype.shift;
delete Vector.prototype.unshift;
delete Vector.prototype.splice;
