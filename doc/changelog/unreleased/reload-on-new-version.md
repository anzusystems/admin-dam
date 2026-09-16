planned
===

### Added

- **The page reloads itself when a new version is deployed.** `ASystemBar` already polled
  `config.json` and compared its `appVersion` to the running one; until now that only lit the bar and
  waited for the reader to click it. The router guard now acts on the same flag: the pending
  navigation is parked, the page reloads, and a `beforeunload` veto that keeps the tab alive
  releases the navigation after three seconds instead of leaving it hanging.

  A 30-second stamp in `sessionStorage` is what stops a reload that does not take from looping.
  admin-cms has run this for a while; the other five now behave the same way.
