export const DEG2RAD = Math.PI / 180;

export function nearlyEq(lhs: number, rhs: number, tolerance = Number.EPSILON): boolean {
	return Math.abs(lhs - rhs) <= tolerance;
}
