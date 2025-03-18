// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace a11y {
	export const REM_BASE_DEFAULT = 16;

	export function rem(pxSize: number): string {
		return `${pxSize / REM_BASE_DEFAULT}rem`;
	}
}
