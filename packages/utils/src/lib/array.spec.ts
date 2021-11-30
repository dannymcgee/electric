import { keyBy, partition } from "./array";

describe("partition", () => {
	it("should partition an iterable by applying a predicate", () => {
		let nums = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
		let [evens, odds] = partition((val: number) => val % 2 === 0)(nums);

		expect(evens).toEqual([0, 2, 4, 6, 8]);
		expect(odds).toEqual([1, 3, 5, 7, 9]);
	});
});

describe("keyBy", () => {
	it("should convert an array into a hashmap object of items keyed by the given item key", () => {
		let people = [{
			name: "Bob",
			age: 30,
		}, {
			name: "Suzie",
			age: 10,
		}, {
			name: "Joe",
			age: 20,
		}];
		let keyed = keyBy("name")(people);

		expect(keyed).toEqual({
			Bob: { age: 30 },
			Suzie: { age: 10 },
			Joe: { age: 20 },
		});
	});
});
