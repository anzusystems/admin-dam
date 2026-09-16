planned
===

### Added

- **`bin/test --unit` and `--e2e`**, the switches the other admins already have. `bin/test` runs the
  vitest suite first — it needs no environment and no browser, so its result is on screen within
  seconds — then Cypress; either switch narrows it to one suite, and passing both is an error rather
  than a silent no-op. A failing vitest run no longer hides behind the e2e run: the script exits
  non-zero at the end.
