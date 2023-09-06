import { Const, Option, match } from "@electric/utils";

import { Vec2, vec2 } from "../../math";
import { Point } from "../path";

export interface FindPointResult<T extends Point> {
	point: T;
	key: "coords" | "handle_in" | "handle_out";
}

export function findNearestPoint<T extends Point>(
	target: Const<Vec2>,
	points: readonly T[],
): Option<FindPointResult<T>> {
	if (!points.length) return null;

	const sorted = points.slice().sort(ascendingByDistanceTo(target));
	const nearestPoint = sorted[0];

	const d2Coords = vec2.dist2(nearestPoint.coords, target);
	const d2Handle_in = nearestPoint.handle_in
		? vec2.dist2(nearestPoint.handle_in, target)
		: Infinity;
	const d2Handle_out = nearestPoint.handle_out
		? vec2.dist2(nearestPoint.handle_out, target)
		: Infinity;

	const d2Nearest = Math.min(d2Coords, d2Handle_in, d2Handle_out);
	const key = match (d2Nearest, {
		[d2Coords]: () => "coords" as const,
		[d2Handle_in]: () => "handle_in" as const,
		[d2Handle_out]: () => "handle_out" as const,
	});

	return {
		point: nearestPoint as T,
		key,
	};
}

function ascendingByDistanceTo(coords: Const<Vec2>) {
	return <T extends Point>(a: T, b: T) =>
		closestInPoint(a, coords) - closestInPoint(b, coords);
}

function closestInPoint<T extends Point>(point: T, ref: Const<Vec2>) {
	return [
		point.coords,
		point.handle_in,
		point.handle_out,
	].reduce(
		(accum, p) => {
			if (!p) return accum;
			return Math.min(accum, vec2.dist2(p, ref));
		},
		Infinity,
	);
}
