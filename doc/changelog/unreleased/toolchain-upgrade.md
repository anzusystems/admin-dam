planned
===

### Changed

- **TypeScript 5.9.3 → ~6.0.3**, `vue-tsc` 3.3.9 → 3.3.11. TypeScript 6 turns `strict` on by default;
  `e2e/tsconfig.json` writes it out rather than inheriting it, so the suite type-checks the same way
  under either compiler.
- **Vite 7.3.6 → 8.3.0** (Rolldown instead of Rollup). Three deprecations the eighth reports are
  cleared: `rollupOptions` → `rolldownOptions`, `manualChunks` → `codeSplitting.groups` (Rolldown
  ignores `manualChunks` outright once `codeSplitting` is present, so this was not cosmetic), and the
  extensionless imports between root configs that `configLoader: 'native'` does not resolve — which is
  why the config files are now `.mts`. Chunk names were diffed before and after: identical.
- **vitest ^4.1.11 → ^5.0.1.**
- **The Cypress suite is its own yarn project** under `e2e/`, with its own `package.json`, install and
  lint set, as the other admins have. Its `yarn ci` now runs `lint:tsc` as well as the formatter and
  oxlint — the type-check existed but was not part of `ci`.
- **Cypress 15.20.1 → ^16.0.0 and `@cypress/grep` ^6.0.3 → ^7.0.0.** **Breaking for every developer:**
  Cypress 16 removed `Cypress.env()`, so the gitignored `e2e/config/<env>.ts` must be rewritten
  `config.env.*` → `config.expose.*`. Left as `env`, the values are accepted without a warning and
  every spec sees `undefined`.

  `bin/test` passes a single `--expose`, never two: the CLI option carries no collector, so a second
  occurrence replaces the first — measured against cypress 16.0.0, where `--expose cfg=stg --expose
  grepTags=@a` left `cfg` at its config default. Pairs are comma separated, which is why a filter's own
  commas become spaces: `@a @b` is `@cypress/grep`'s OR, and a comma there would read as a pair boundary.

  `grepIntegrationFolder` is gone from the config: it does not exist in `@cypress/grep` 7 at all, and
  `grepFilterSpecs` is inert because the plugin globs from `process.cwd()`, which inside
  `setupNodeEvents` is the config file's own directory.
- `oxlint` 1.82.0 → 1.83.0 and `oxfmt` ^0.67.0 → ^0.68.0 in `e2e/`; `@vitejs/plugin-vue` ^6.0.8 → ^6.0.9.

### Fixed

- **`dayjs` was used in `src/` without being declared.** It resolved through a transitive copy; it is a
  direct dependency now.
