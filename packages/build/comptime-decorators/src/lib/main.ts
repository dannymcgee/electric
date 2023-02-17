import match from "@electric/match"
import * as ts from "typescript"

import { PluginContextImpl } from "./internal/context";
import { Plugin } from "./internal/plugin"
import * as types from "./types" // For JSDoc links
import { PluginConfig, Traversal } from "./types"

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
export default function (
	decorators: any,
	config: PluginConfig = { traversal: Traversal.Postorder }
) {
	// FIXME: The Nx custom transformers loader automatically prepends a
	// configuration object as the first argument to this function, even if no
	// such configuration object is provided to the executor options. We want to
	// allow `program: ts.Program` as the sole argument for compatibility with
	// other APIs, so the workaround for now is to suss out the arguments at
	// runtime.
	let program: ts.Program

	return (...args: any[]): ts.TransformerFactory<ts.SourceFile> => {
		[config, program] = match(args.length, {
			1: () => [config, args[0]],
			2: () => {
				// If the first argument is an empty object (i.e. provided by Nx),
				// use the argument provided to the top-level function as the config
				if (typeof args[0] === "object" && Object.keys(args[0]).length === 0)
					return [config, args[1]]

				// Config was likely overridden by an Nx project config, so use the
				// new object
				return args
			},
			_: () => {
				throw new Error(`Expected 1 or 2 arguments, received ${args.length}: ${args}`)
			}
		})

		const typeChecker = program.getTypeChecker()

		return context => {
			const plugin = new Plugin(decorators, config, new PluginContextImpl({
				transformContext: context,
				program,
				typeChecker,
				userContext: undefined,
			}))

			return sourceFile => plugin.walk(sourceFile, sourceFile)
		}
	}
}
