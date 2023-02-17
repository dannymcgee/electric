import { float, int } from "../types";

export interface Serde<T> {
	read(value: string): T
	write(value: T): string
}

// Int
const readInt = (value: string) => parseInt(value, 10)
const writeInt = (value: int) => value.toString(10)

export const INT = serde<int>({
	read: readInt,
	write: writeInt,
})

export const INT_OPT = serde<int | null>({
	read: readInt,
	write: writeInt,
	optional: true,
})

// Float
const readFloat = (value: string) => parseFloat(value)
const writeFloat = (value: float) => value.toString(10)

export const FLOAT = serde<float>({
	read: readFloat,
	write: writeFloat,
})

export const FLOAT_OPT = serde<float | null>({
	read: readFloat,
	write: writeFloat,
	optional: true,
})

// Bool
export const BOOL: Serde<boolean | null | undefined> = {
	read: value => value === "true" || value === "",
	write: value => (value ? "" : null) as unknown as string
}

// Sring
export const STRING: Serde<string> = {
	read: value => value,
	write: value => value ?? "",
}

function serde<T>({
	read,
	write,
	optional = false
}: Serde<Exclude<T, null | undefined>> & {
	optional?: boolean
}): Serde<T> {
	return {
		read(value) {
			if (!value) {
				if (optional) return null as T
				throw new TypeError("Empty or null string passed to non-optional Serde.read")
			}
			return read(value)
		},
		write(value) {
			if (value == null) {
				if (optional) return ""
				throw new TypeError("Nullish value passed to non-optional Serde.write")
			}
			return write(value as Exclude<T, null | undefined>)
		}
	}
}
