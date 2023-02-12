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
	return (program: ts.Program): ts.TransformerFactory<ts.SourceFile> => {
		const typeChecker = program.getTypeChecker()

		return (context) => {
			const plugin = new Plugin(decorators, {
				...context,
				program,
				typeChecker,
			})

			return sourceFile => plugin.walk(sourceFile, sourceFile)
		}
	}
}
