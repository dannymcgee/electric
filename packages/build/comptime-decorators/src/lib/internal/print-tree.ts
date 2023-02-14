import * as ts from "typescript"

export class MutableString {
	private _value = ""

	appendLine(line: string) {
		this._value += line + "\n"
	}

	valueOf() {
		return this._value
	}
}

export function printTree(parent: ts.Node, accum: MutableString, depth = 0) {
	const indent = "  ".repeat(depth)
	const span = `[${parent.pos}..${parent.end}]`
	accum.appendLine(`${indent}${ts.SyntaxKind[parent.kind]} ${span}`)

	ts.forEachChild(parent, child => printTree(child, accum, depth + 1))
}
