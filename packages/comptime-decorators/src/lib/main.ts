import match from "@electric/match"
import * as ts from "typescript"

import * as types from "./types" // For JSDoc links
import { Plugin } from "./internal/plugin"

/**
 * @param decorators
 * A module that exports any number of comptime-decorator implementations. Any
 * exports from this module that match the names of any decorators in the target
 * TypeScript project must implement the {@linkcode types.Decorator Decorator}
 * type.
 *
 * @returns
 * A function that takes a {@link ts.Program TypeScript Program} and returns a
 * {@linkcode ts.TransformerFactory TransformerFactory}.
 *
 * @see {@linkcode types.Decorator Decorator}
 */
// FIXME: Needing to type this parameter as `any` is really unfortunate, but
// TypeScript doesn't seem to want to correctly infer the kinds of inputs that
// are valid here if we use something like `Record<string, Decorator>`, or even
// `T extends Record<string, Decorator>`. Mitigated with documentation in the
// meantime.
export default function (decorators: any) {
	// FIXME: The Nx custom transformers loader automatically prepends a
	// configuration object as the first argument to this function, even if no
	// such configuration object is provided to the executor options. We want to
	// allow `program: ts.Program` as the sole argument for compatibility with
	// other APIs, so the workaround for now is to suss out the arguments at
	// runtime.
	return (...args: any[]): ts.TransformerFactory<ts.SourceFile> => {
		const program = match(args.length, {
			1: () => args[0],
			2: () => args[1],
			_: () => {
				throw new Error(`Expected 1 or 2 arguments, received ${args.length}: ${args}`)
			}
		}) as ts.Program

		const typeChecker = program.getTypeChecker()

		return context => {
			const plugin = new Plugin(decorators, {
				transformContext: context,
				program,
				typeChecker,
				userContext: undefined,
			})

			return sourceFile => plugin.walk(sourceFile, sourceFile)
		}
	}
}
