planned
===

### Fixed

- **The two `any` casts the lint rule could not see.** `@typescript-eslint/no-explicit-any` has been
  an error here for a while, but it does not reach template expressions: `currentUser as any` and
  `el as any` sat in `<template>` blocks and passed. Both are now typed in the script, where a name
  resolves against types rather than against the setup bindings — the current user is narrowed to
  `AnzuUserMinimal`, which the dropdown asks for and which `AnzuUser` satisfies except that
  `BaseUser` leaves `id` optional and nullable.

  With the other four admins turning the rule on, its `'off'` counterpart in admin-cms is now the
  only one left.
