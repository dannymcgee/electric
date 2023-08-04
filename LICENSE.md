# Electric Multi-License 1.0

Different portions of this repository are made available for use under different
terms and conditions. Before making use of any of the files in this repository,
please take a moment to read over this document and understand what you're
agreeing to &mdash; I promise it's not too complicated, and you're welcome to
[get in touch](mailto:dannymcgee@gmail.com) if there's anything you're not sure
about.

## Overview

This repository is a "monorepo," meaning that it contains multiple distinct
but interdependent projects which are co-located within a single repository for
the sake of developer convenience. The main purpose of this document is to
demarcate the boundary lines of the different copyrighted works within this
repository with respect to the different terms and conditions that apply to
the use of each.

Generally speaking, the libraries in this repository (e.g., under `packages`)
are dual-licensed under copyleft or non-commercial terms, while the applications
(e.g., under `apps`) are licensed under non-commercial terms only. In both
cases, commercial licenses are available [by request](mailto:dannymcgee@gmail.com)
if the public licenses don't work for you.

To find details of the specific terms and conditions governing the use of a
particular source file or set of files, find the nearest parent directory
containing a "license file," which can be identified by a filename of `LICENSE`
or `LICENSE.md`. The contents of that license file describe the terms and
conditions governing the use of the source file(s) in question.

## Index of Licenses

For convenience, the following list is provided as an index of the license files
contained in this repository at the time of writing, and the names of the
licenses they contain:

- `/LICENSE.md` (this is the file you're currently reading) - Electric Multi-License 1.0
- `/apps/LICENSE.md` - Prosperity Public License 3.0.0
- `/demos/LICENSE.md` - MIT License
- `/packages/LICENSE.md` - Parity Public License 7.0.0 _or_ Prosperity Public License 3.0.0
- `/tools/LICENSE.md` - MIT License

This index should not be considered exhaustive or authoritative &mdash; actual
license file locations or contents may change without a corresponding update to
this index (though I will try my best to keep it up to date). When determining
what terms and conditions govern the use of a particular source file or set of
files, the actual file structure and contents of this repository should be
consulted.

## Definitions

- "Nearest parent directory," as used in the Overview section of this document,
  is defined, with respect to a given source file, in terms of this repository's
  file system hierarchy as would be commonly understood by software developers
  and other computer science professionals.

  For example, given the following hypothetical file system paths:

	- `/A/B/C/foo.ts`
	- `/A/B/bar.ts`
	- `/A/B/LICENSE.md`
	- `/A/baz.css`
	- `/A/LICENSE`

	Use of the source files located at `/A/B/C/foo.ts` and `/A/B/bar.ts` would be
	governed by the contents of the license file located at `/A/B/LICENSE.md`,
	while use of the source file located at `/A/baz.css` would be governed by the
	contents of the license file located at `/A/LICENSE`.

- "Source file" is defined as any file within this repository containing text-
  or binary-formatted data, including its contents or any form resulting from
  its mechanical transformation or translation (including but not limited to
  compiling, transpiling, reformatting, bundling, etc.).

- "The software" or "this software", when used in any of this repository's
  license files, refers to the particular set of source files, or any
  substantial portion thereof, whose use is governed by that particular license
  file as described in this document.

## Terms and Conditions

The remainder of this document governs the use of source files in this
repository which are not otherwise covered by a different license file as
previously described.

---

Copyright 2023 Danny McGee

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the “Software”), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
