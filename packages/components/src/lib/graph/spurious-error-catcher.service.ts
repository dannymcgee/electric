import { ErrorHandler, isDevMode } from "@angular/core";

export class SpuriousErrorCatcher implements ErrorHandler {
	handleError(error: unknown): void {
		if (isNgError(error)
			&& error.code === "100"
			&& error.stack.includes("GraphComponent_Template"))
		{
			if (isDevMode())
				console.warn(error);
		}
		else {
			throw error;
		}
	}
}

interface NgError {
	code: string;
	message: string;
	stack: string;
}

function isNgError(error: unknown): error is NgError {
	return (typeof error === "object"
		&& error != null
		&& "code" in error);
}
