planned
===

### Changed

- **`@vueuse/core` and `@vueuse/integrations` `14.4.0` → `15.0.0`**, both kept as exact pins. No
  source change was needed: admin-dam's own VueUse surface is three composables — `useDebounceFn`
  behind the search field of eighteen datatables, `onKeyUp` for the arrow-key navigation on the two
  asset list views, and `useClipboard` on the asset-slot row — and none of the six v15 breaking
  changes reaches any of them. `useDebounceFn` in particular is untouched; the `trailing` default
  that v15 flips belongs to `useThrottleFn`.

  The rest of the v15 list is absent here too: no `templateRef` (Vue's own `useTemplateRef` is a
  different API and unaffected), none of the timer composables whose `interval` / `immediate`
  options were dropped in favour of `scheduler`, no `useWebSocket` — DAM notifications go through
  common-admin, and its socket declares no `heartbeat`, which is the only part of `useWebSocket`
  v15 changed — and no `useEventSource` or `useIDBKeyval`. Dropping Node 20 costs nothing: `engines`
  is already `^22.22.2 || ^24.15.0 || >=26.0.0`, and CI and the dev image are both node24.

  **One regression arrives from outside this repo.** `ADatatablePagination`, which 26 components
  render, throttles its four page buttons with `useThrottleFn(() => { page = page + 1 }, 300)` — a
  relative mutation on a click handler, exactly the shape v15's `trailing: true` default breaks: a
  double-click on next/prev now fires once immediately and replays at the 300 ms boundary, stepping
  two pages from one burst. The call site is in the prebuilt `@anzusystems/common-admin` dist, so it
  cannot be fixed from here; the pin stays where it is until a common-admin build carrying the
  explicit `trailing: false` lands. Until then `yarn install` also warns that the installed
  common-admin still asks for `@vueuse/core@^14.1.0` — a peer range its own v15 work has already
  moved to `^15.0.0`, unreleased.
