import {
	PluginContext,
	ClassDecorator as _ClassDecorator,
	MethodDecorator as _MethodDecorator,
	PropertyDecorator as _PropertyDecorator,
} from "@electric/comptime-decorators"

import * as ts from "typescript"

export type ClassDecorator = _ClassDecorator<Context | undefined>
export type MethodDecorator = _ClassDecorator<Context | undefined>
export type PropertyDecorator = _PropertyDecorator<Context | undefined>

export class Context {
	#inputs = new WeakMap<ts.Node, ts.PropertyDeclaration[]>()

	addInput(parent: ts.Node, node: ts.PropertyDeclaration) {
		let inputs: ts.PropertyDeclaration[] = []
		if (!this.#inputs.has(parent))
			this.#inputs.set(parent, inputs)
		else
			inputs = this.#inputs.get(parent)!

		inputs.push(node)
	}

	getInputs(parent: ts.Node): ts.PropertyDeclaration[] {
		return this.#inputs.get(parent) ?? []
	}
}

export function getContext(this: PluginContext<Context | undefined>): Context {
	return this.userContext ??= new Context()
}
