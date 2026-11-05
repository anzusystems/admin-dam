import { defineConfig } from '@playwright/test'
import * as path from 'path'
import base from './playwright.config'

/**
 * The route walk (`tests/routes`), apart from the default run: `bin/test --routes`.
 * It opens every page of the app, so it is run by hand, e.g. before a release or after a change across all pages.
 */

export default defineConfig({
  ...base,
  testDir: path.resolve(__dirname, 'tests/routes'),
  testIgnore: [],
  // A route is only opened, nothing is clicked or typed, so the routes are spread over workers. The default run
  // keeps a worker per account because its tests switch the licence; the walk does not (an asset's address
  // switches it for that page only, not in the account's settings).
  workers: 4,
  retries: 0,
  globalSetup: path.resolve(__dirname, 'setup/routesGlobalSetup.ts'),
  // A route may take up to 240 s (common-admin's ROUTE_TIMEOUT); one hour is far more than a walk takes.
  globalTimeout: 60 * 60 * 1000,
  // Folders of its own: a run empties its outputDir, and the walk would wipe the last suite run's traces.
  reporter: [['list'], ['html', { outputFolder: '.report-routes', open: 'never' }]],
  outputDir: '.results-routes',
  // `use` comes from the default config, the secure context on a local http stack included.
  projects: [
    { name: 'boot', testMatch: /boot\.spec\.ts$/ },
    // An app that does not boot stops the walk here instead of failing each route after its timeout.
    { name: 'routes', testMatch: /routes\.spec\.ts$/, dependencies: ['boot'] },
  ],
})
