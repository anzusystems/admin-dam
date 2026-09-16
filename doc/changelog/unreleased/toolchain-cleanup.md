planned
===

### Fixed

- **`bin/lint` and `bin/test` reported success whichever way they ran.** `bin/docker-compose` ends with a
  cleanup block, and `if false; then…fi` exits 0, so the status of the compose command was discarded — and
  `bin/docker-compose` is the last command in both wrappers. A failing lint or a failing test run came back
  green. The status is now captured before the cleanup and returned.
- **`bin/test` exited 0 after rejecting an argument.** The three validation branches ended in a bare `exit`
  preceded by `help`, which ends in an `echo`, so an invalid `-e`, `-b` or unknown switch printed the error
  and reported success. They exit 1. The `exit` that follows the Cypress run is left alone: a bare `exit`
  returns the status of the last command, which is what that one wants.
- **`bin/test -e` with no value looped forever.** `shift 2` with one argument left returns 1 and shifts
  nothing, so `continue` came back to the same token. Four sites, one per value-taking option.
- **Locale messages were never precompiled.** `include: './src/locales/**.json'` matched nothing — `**`
  inside a path segment degrades to `*`, and every message file sits a directory deeper. The messages were
  shipped as raw JSON and compiled in the browser on every load. The documented `'./src/locales/**'` is
  not the fix here: it also matches `src/locales/sk.ts`, which the plugin then treats as a message
  resource, dropping its `import { messagesSk }` and the spreads that follow — silently, with a green
  build. The glob is `'./src/locales/**/*.json'`.
- `engines.node` was still `^20.19.0 || >=22.12.0`, alone among the admins and out of step with this
  repo's own `e2e/package.json` and its node24 CI image. It is `^22.22.2 || ^24.15.0 || >=26.0.0`.

### Removed

- **The browserslist freshness check.** `lint:browserslist` failed `ci` when `caniuse-lite` went six
  months stale, so a pull request that touched nothing could go red with time. It had nothing to guard
  here: the query is `supports css-cascade-layers`, whose minimum per engine is a historical fact, so
  dropping two years of browser data leaves the lightningcss targets — and the minified CSS — byte for
  byte identical. `.browserslistrc` goes with it; nothing reads it, because the query is written out in
  `vite.config.mts`. `browserslist:update` stays as a manual script.
