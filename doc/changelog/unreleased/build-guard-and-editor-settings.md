planned
===

### Fixed

- **`bin/build` no longer reports success after a failed install or build.** `yarn install` and
  `yarn build` were two separate statements, so a failed install went straight on to the build, and
  the `Build ready` line that follows the build meant the bare `exit` returned the status of that
  `echo` rather than the build's. Both now stop the script, and `Build ready` is printed only when
  there is something ready.

- **`.vscode/settings.json` and `extensions.json` are shared.** The whole directory was ignored, so
  the toolchain settings — oxfmt as the formatter, fix-on-save for oxlint then eslint, stylelint over
  `scss` and `vue`, the workspace TypeScript — reached nobody. They are the ones common-admin already
  carries; everything else under `.vscode/` stays ignored.

- **`bin/test` installs the Cypress binary the way blog and inhouse do.** The guard it replaces
  tested `${CYPRESS_CACHE_FOLDER}`, a path `.env.docker.dist` sets relative to the working directory
  — correct only as long as nobody moves the `cd` above it — and re-downloaded with `--force` on
  every miss. The plain `cypress install` is idempotent and needs neither.
