# Electric

Electric is an experimental project for quickly bootstrapping hybrid desktop applications built with Angular and Tauri (or, maybe someday, Electron).

It's primarily intended for my own use and isn't really designed for public consumption in its current form. Large portions of the codebase are entirely undocumented, and a few of its features are ad-hoc, half-finished solutions that haven't been rigorously tested.

## Contents
- `packages` is for shared libraries and is where the bulk of the codebase lives.
    - [`components`](./packages/components) is the main Angular UI library and design system.
    - [`ng-utils`](./packages/ng-utils) is an Angular utility library, for reusable Angular features that are unopinionated with regards to styling. Similar in concept to `@angular/cdk`.
    - [`platform`](./packages/platform) is for abstraction of APIs that are specific to the host environment, like window management.
    - [`style`](./packages/style) is a Sass utility library with some TypeScript modules that duplicate the APIs of their corresponding Sass modules (in case you need to move some styling logic to runtime).
    - [`testing`](./packages/testing) is a utility library for working with Jest and Spectator.
    - [`utils`](./packages/utils) is sort of an extended standard library. A lot of it is re-implemented `lodash` algorithms without the ES6+ polyfilling.
- `demos` is for library demonstrations.
    - [`showcase`](./demos/showcase) is a hand-built Angular web application in the vein of Storybook, showing off the main UI library and design system.
    - `tauri-app` is a Tauri wrapper around `showcase`.
    - `electron-app` is not a thing yet, but if/when it ever happens, it would be the Electron counterpart to `tauri-app`.
- `apps` is where actual applications live, but mostly I build apps under their own feature branches to keep their Git histories distinct from the main codebase.
    - [`tidy`](./apps/tidy) is an imagined solution to my data hoarding problem that I rage-built one night after scrounging for free disk space for the umpteenth time that month. Currently it's just a sad, barely functional file explorer.
- `tools` is for build tooling. The repo is managed by [Nx](https://nx.dev), which does all of the heavy lifting, so mostly this is a place for custom Nx executors and generators.

Project-specific documentation, where available, can be found in a separate readme at the project's root.

## Development

> **NOTE:** This project is my personal baby, and as such I'm not currently accepting pull requests.

Node.js 16+ is required for installing dependencies and building things. There's a `postinstall` hook that should setup any additional JavaScript prerequisites after running `npm install`.

[Rust](https://www.rust-lang.org/learn/get-started) is required for working with the Tauri apps, but there's no need to globally install the Tauri CLI &mdash; the project executors will use the correct version automatically, as specified via the `npm` dependencies.

### Building / Running / Testing

Each library/application has a `project.json` manifest at its root that enumerates the Nx executors available to that project under the `target` field. These executors can be run by using the following template:

```sh
npx nx <target-name> <project-name> [options]
```

The options available vary per executor and can be discovered by passing `--help`, e.g.:
```sh
npx nx build components --help
```

Generally, most projects will have `build` and `test` commands, while applications additionally have a `serve` command to start the web frontend on its own, and `launch` to start both the web frontend and the Tauri native app.

For example, to start the showcase demo in a web browser, run:
```sh
npx nx serve showcase
```

Or to launch it as a Tauri app:
```sh
npx nx launch showcase
```

Note that the applications under `apps` and in feature branches have generally not been designed for web-only compatibility, so they may immediately throw errors if you try to `serve` and open them directly in a web browser.
