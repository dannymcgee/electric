// TODO
import { PathCommand } from "./path-command";

enum TransactionType { Edit, Insert, Remove }

interface EditPayload {
	index: number;
	prev: PathCommand;
	next: PathCommand;
}

interface InsertOrRemovePayload {
	index: number;
	commands: PathCommand[];
}

type Transaction =
	| { type: TransactionType.Edit;   payload: EditPayload; }
	| { type: TransactionType.Insert; payload: InsertOrRemovePayload; }
	| { type: TransactionType.Remove; payload: InsertOrRemovePayload; }
