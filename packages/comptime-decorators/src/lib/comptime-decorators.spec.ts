import { comptimeDecorators } from "./comptime-decorators";

describe("comptimeDecorators", () => {
	it("should work", () => {
		expect(comptimeDecorators()).toEqual("comptime-decorators");
	});
});
