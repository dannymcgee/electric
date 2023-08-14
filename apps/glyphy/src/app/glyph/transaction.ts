import { PathCommand } from "./path-command";

export enum TransactionType { Edit, Insert, Remove }

export interface EditPayload {
	index: number;
	prev: PathCommand;
	next: PathCommand;
}

export interface InsertOrRemovePayload {
	index: number;
	commands: PathCommand[];
}

export type TransactionEntry =
	| { type: TransactionType.Edit;   payload: EditPayload; }
	| { type: TransactionType.Insert; payload: InsertOrRemovePayload; }
	| { type: TransactionType.Remove; payload: InsertOrRemovePayload; }

export type Transaction = TransactionEntry[];
