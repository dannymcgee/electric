export function nearlyEq(lhs: number, rhs: number, tolerance = Number.EPSILON): boolean {
	return Math.abs(lhs - rhs) <= tolerance;
}
