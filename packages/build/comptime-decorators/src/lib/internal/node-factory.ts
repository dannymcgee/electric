import * as ts from "typescript"

import { NodeFactory as INodeFactory } from "../types"

type ReadonlyWeakSet<T extends object>
	= Pick<WeakSet<T>, "has">

export class NodeFactory {
	private static _instance: INodeFactory
	static get instance() {
		// We can't (feasibly) `implements INodeFactory` because it has hundreds
		// of methods, so we do it programmatically in the constructor. The
		// validity of that ad-hoc interface implementation is checked with a unit
		// test.
		return this._instance ??= new NodeFactory() as unknown as INodeFactory
	}

	private _updated = new WeakSet<ts.Node>()
	/**
	 * Keeps a weak reference to any AST nodes that were updated by the factory.
	 */
	static get updated(): ReadonlyWeakSet<ts.Node> {
		return (this.instance as unknown as NodeFactory)._updated
	}

	private _created = new WeakSet<ts.Node>()
	/**
	 * Keeps a weak reference to any AST nodes that were created by the factory.
	 */
	static get created(): ReadonlyWeakSet<ts.Node> {
		return (this.instance as unknown as NodeFactory)._created
	}

	private constructor () {
		for (let verboseKey of Object.keys(ts.factory)) {
			// The ts.NodeFactory methods are crazy verbose which makes them harder
			// to read IMO. We follow Babel's lead by dropping the `create` prefix
			// from creation methods, and also chop down `Declaration`, `Statement`
			// and `Expression` suffixes to their (widely used) abbreviated forms.
			const key = verboseKey
				.replace(/^create/, "")
				.replace(/Declaration$/, "Decl")
				.replace(/Statement$/, "Stmt")
				.replace(/Expression$/, "Expr")

			// Add a side-effect to `create` and `update` methods to add their
			// results to the corresponding WeakSets.
			if (verboseKey.startsWith("create")) {
				Object.defineProperty(this.constructor.prototype, key, {
					value(...args: any[]): any {
						const result = (ts.factory as any)[verboseKey](...args)
						this._created.add(result)
						return result
					},
					enumerable: true,
				})
			}
			else if (verboseKey.startsWith("update")) {
				Object.defineProperty(this.constructor.prototype, key, {
					value(...args: any[]): any {
						const result = (ts.factory as any)[verboseKey](...args)
						this._updated.add(result)
						return result
					},
					enumerable: true,
				})
			}
			// Inherit all other properties directly.
			else {
				Object.defineProperty(this.constructor.prototype, key, {
					value: (ts.factory as any)[verboseKey],
				})
			}
		}
	}
}
