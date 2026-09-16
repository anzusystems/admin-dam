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

  One call site outside this repo did need the flip. `ADatatablePagination`, which 26 components
  render, throttles its four page buttons with a relative mutation on a click handler — exactly the
  shape v15's new `trailing: true` default breaks, where a double-click on next/prev fires once
  immediately and replays at the 300 ms boundary, stepping two pages from one burst. The call site
  lives in `@anzusystems/common-admin`; the pinned `1.47.0-beta.dev-1788935859` carries the explicit
  `trailing: false` on all four buttons, so the behaviour here is unchanged from v14.

- **The rest of the bumps in the same round.** `@anzusystems/common-admin`
  `1.47.0-beta.dev-1788935857` → `1.47.0-beta.dev-1788935859`, the build whose `@vueuse/*` peer
  ranges are `^15.0.0` and whose datatable pagination passes `trailing: false` explicitly;
  `@sentry/vue` `10.74.0` → `10.75.0`; `vue-i18n` `11.4.10` → `11.4.12`; `unplugin` `3.3.0` →
  `3.4.0`; `@types/node` `24.13.4` → `24.13.5`. All patch or minor, none touching an API this repo
  calls.
