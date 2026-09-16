planned
===

### Added

- **A route smoke test** (`src/test/routes.test.ts`), the one the other admins run: 69 generated
  routes, each resolved to its own record rather than the catch-all, the declared and runtime name
  sets checked against each other in both directions, and every route asserted to have a component.
  Importing `vue-router/auto-routes` is half the test — it pulls in every page and, through them,
  their stores, api clients and composables, so anything that throws during module evaluation fails
  here.

  It cannot pass quietly: without `src/typed-router.d.ts` the suite fails to load, and with a stale
  one two assertions fail — verified by removing a single route from the declaration. `yarn ci` runs
  `generate:dts` before the parallel stage, so a fresh checkout has the file before either the
  linters or the tests start.
- **`@vitest/ui` and `yarn test:ui`**, which the other five have.

### Changed

- **The shared eslint and stylelint config**, the ones blog, forum and inhouse run. Both took it
  with zero findings. The `anzu-local/valid-route-name` rule here was the weaker variant: it
  resolved the declaration through `process.cwd()` and returned empty when it found nothing, so a
  run started from a subdirectory checked nothing and said so by saying nothing.

  One line stays different on purpose: `@typescript-eslint/no-explicit-any` is `error` here and
  `off` in the others. This repo has two `any` in `src` and has been enforcing the rule, so taking
  the shared config must not quietly switch it back off. The line goes away once the others turn it
  on as well.
- **The file-based routing options move to `routerPages.config.mts`**, byte for byte the same file
  in all six admins, which is what lets vitest build the same route table the app does.
