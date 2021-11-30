import { mapValues } from "./object";

describe("mapValues", () => {
	it("should create a new object by applying a callback to each entry", () => {
		let obj = {
			lorem: 1,
			ipsum: 2,
			dolor: 3,
			sit: 4,
			amet: 5,
		};
		let squared = mapValues((val: number) => Math.pow(val, 2))(obj);

		expect(squared).toEqual({
			lorem: 1,
			ipsum: 4,
			dolor: 9,
			sit: 16,
			amet: 25,
		});
	});
});
