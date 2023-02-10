import { comptimeDecoratorsE2e } from "./comptime-decorators-e2e";

describe("comptimeDecoratorsE2e", () => {
	it("should work", () => {
		expect(comptimeDecoratorsE2e()).toEqual("comptime-decorators-e2e");
	});
});
