import { Component, input } from "@electric/framework"

export type Variant
	= "primary"
	| "warning"
	| "secondary"
	| "tertiary"

@Component("elx-button")
export class ButtonElement extends HTMLElement {
	@input role = "button"
	@input variant: Variant = "tertiary"

	render = () => (
		<template shadowroot="open">
			<slot class="icon pre" part="icon:pre" name="icon:pre" />
			<slot class="label" part="label" />
			<slot class="icon post" part="icon:post" name="icon:post" />
		</template>
	)
}
