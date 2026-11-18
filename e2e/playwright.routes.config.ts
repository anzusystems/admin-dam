import * as path from 'path'
import { defineRouteWalkConfig } from '@anzusystems/common-admin/e2e'
import base from './playwright.config'

/**
 * The route walk (`tests/routes`), apart from the default run: `bin/test --routes`.
 * It opens every page of the app, so it is run by hand, e.g. before a release or after a change across all pages.
 * The shared settings (4 workers, no retries, `.report-routes` / `.results-routes`, boot → routes) are common-admin's;
 * the default run keeps a worker per account because its tests switch the licence, the walk does not (an asset's
 * address switches it for that page only, not in the account's settings). `use` comes from the default config, the
 * secure context on a local http stack included.
 */
export default defineRouteWalkConfig(base, {
  globalSetup: path.resolve(__dirname, 'setup/routesGlobalSetup.ts'),
  // A route may take up to 240 s (common-admin's ROUTE_TIMEOUT); one hour is far more than a walk takes.
  globalTimeout: 60 * 60 * 1000,
})
