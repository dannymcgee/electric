export default interface Options {
	/**
	 * Path to the directory containing the icon SVGs, from the workspace root.
	 * E.g., "packages/my-library/src/assets/icons"
	 * @required
	 */
	pathToSvgs: string;
	/**
	 * Path to the directory where the output file will be generated, from the
	 * workspace root. E.g., "packages/my-library/src/lib/icon"
	 * @required
	 */
	outputPath: string;
	/**
	 * Filename of the output file.
	 * @required
	 */
	outFileName: string;
}
