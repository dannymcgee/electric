import { getContext, PropertyDecorator } from "./context"

export const input: PropertyDecorator
= function (node, $) {
	getContext.call(this).addInput(this.original(node).parent, node)

	return node
}
