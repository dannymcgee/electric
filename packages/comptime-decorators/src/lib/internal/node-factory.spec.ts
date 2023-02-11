import * as path from "path"
import * as ts from "typescript"

import { TsCompiler } from "../compiler"
import { NodeFactory } from "./node-factory";

describe("NodeFactory", () => {
	it("class includes all methods declared by its interface", () => {
		// The NodeFactory prototype will be mostly empty until the singleton is constructed
		const _ = NodeFactory.instance
		const nodeFactoryTypeMembers = resolveNodeFactoryTypeMembers()
		const nodeFactoryMembers = Object.getOwnPropertyNames(NodeFactory.prototype)

		// Sanity check -- if TS changes the name of this interface or liquidates
		// it for some reason, this test case needs to fail.
		expect(nodeFactoryTypeMembers.length).toBeGreaterThan(100)
		expect(nodeFactoryTypeMembers.length).toBeLessThan(1000)

		// The generated factory object has some extra methods that aren't in the
		// `ts.NodeFactory` interface. That's okay for now, as long as all of the
		// declared methods _do_ exist.
		expect(nodeFactoryMembers.length).toBeGreaterThanOrEqual(nodeFactoryTypeMembers.length)

		for (let key of nodeFactoryTypeMembers) {
			expect(nodeFactoryMembers).toContain(key)
			expect(typeof (NodeFactory.prototype as any)[key]).toBe("function")
		}
	})
})

function resolveNodeFactoryTypeMembers(): string[] {
	const result: string[] = []

	const tsc = new TsCompiler(path.resolve(__dirname, "../../../tsconfig.lib.json"))
	const typeChecker = tsc.program.getTypeChecker()
	const sourceFile = tsc.sourceFiles.find(f => f.fileName.includes("types.ts"))!

	function walk(parent: ts.Node) {
		ts.forEachChild(parent, child => {
			if (visit(child))
				walk(child)
		})
	}

	function visit(node: ts.Node) {
		if (ts.isTypeAliasDeclaration(node) && node.name.text === "NodeFactory") {
			const type = typeChecker.getTypeAtLocation(node.name)
			const props = typeChecker.getPropertiesOfType(type)

			result.push(...props.map(symbol => symbol.name))

			return false
		}
		return true
	}

	walk(sourceFile)

	return result
}
