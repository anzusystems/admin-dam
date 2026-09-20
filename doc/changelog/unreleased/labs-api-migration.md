planned
===

### Changed

- **Every api call moved onto the labs helpers.** `useApiRequest`, `useApiFetchList`,
  `useApiFetchByIds`, `useApiFetchListBatch`, `useApiCommand` and `useApiFetchItems` replace the
  `src/services/api/` functions, which now fail an import rather than only carrying a doc block.

  Mechanically this is a rename, and the compiler found all of it. What is not mechanical is what a
  response means, and none of it is something the compiler points at:

  - a failure arrives as the class that describes it — `AnzuApiAxiosError`, `AnzuApiTimeoutError`,
    `AnzuApiResponseCodeError` — instead of `AnzuFatalError` for everything. Code branching on
    `isAnzuApiAxiosError` around a call that could not previously produce one now takes a branch it
    never took before
  - a request the user superseded — another keystroke in an autocomplete, a route change mid-load —
    is an `AnzuApiCancelledError` and no longer raises an alert, where it used to be
    indistinguishable from a dead backend
  - a 204 answers `undefined` where it used to answer `null`, and a by-ids 204 answers `[]`
  - a 202 with no body resolves instead of rejecting as a fatal error
  - a list response is checked before it is handed over. A malformed answer used to reach the caller
    as `undefined` typed as an array, and failed later somewhere unrelated; it is now a thrown,
    logged error naming the url

- **`anzu/prefer-api-fetch-items` is on as an error.** A `useApiRequest` whose response type is a
  list — a bare array, or an envelope with a list in `data` — has to be `useApiFetchItems`, which
  checks the shape it was told to expect. A call that legitimately reads the envelope's metadata
  takes a per-line disable with the reason written next to it.
