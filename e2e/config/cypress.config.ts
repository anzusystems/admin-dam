import { defineConfig } from 'cypress'
import { downloadFile } from 'cypress-downloadfile/lib/addPlugin.js'
import * as fs from 'fs'
import * as path from 'path'

export default defineConfig({
  reporter: 'cypress-mochawesome-reporter',
  reporterOptions: {
    reportDir: 'report/html',
    reportFilename: '[status]_[datetime]',
    timestamp: 'dd/mm_HH/MM',
    charts: true,
    overwrite: false,
    quiet: true,
    showPending: 'false',
  },
  trashAssetsBeforeRuns: true,
  watchForFileChanges: false,
  defaultCommandTimeout: 10000,
  viewportHeight: 1080,
  viewportWidth: 1920,
  chromeWebSecurity: false,
  // The bundled Electron browser is deprecated as a test browser in Cypress 16.
  defaultBrowser: 'chrome',
  // Everything the specs read in the browser. Cypress 16 removed `Cypress.env()`: `env` is now
  // server-side only, reachable with `cy.env()`, and `expose` is what reaches the browser.
  expose: {
    cfg: 'stg', // local or stg
    loginUser: 'admin',
    failOnUncaughtException: false,
    visitBaseUrl: true,
    // Of @cypress/grep 7's options this config uses two: `grepTags`, passed by `bin/test` through
    // `--expose`, and `grepOmitFiltered`. `grepFilterSpecs` is deliberately absent -- its spec
    // pre-filter globs from `process.cwd()`, which inside setupNodeEvents is this file's
    // directory, so it matches nothing and only prints that it could not pre-filter. Run-time
    // filtering does the work either way.
    grepOmitFiltered: true,
  },
  e2e: {
    video: true,
    // Cypress defaults every one of these to a `cypress/` prefix. This project is the e2e
    // root, so they are named explicitly.
    supportFile: 'support/e2e.ts',
    fixturesFolder: 'fixtures',
    downloadsFolder: 'downloads',
    specPattern: 'tests/**/*.cy.ts',
    setupNodeEvents(on, config) {
      on('task', {
        downloadFile,
        // `cy.exec` was removed in Cypress 16 and `cy.task` is its replacement. Resolved from
        // this file rather than from cwd, so it cannot drift with the plugin process.
        fixtureExists: (relativePath: string) => fs.existsSync(path.resolve(__dirname, '../fixtures', relativePath)),
      })
      require('cypress-mochawesome-reporter/plugin')(on)
      // @cypress/grep 6 moved the plugin to its own subpath and stopped default-exporting
      // it. `./src/plugin` is not in the package's exports map at all.
      const { plugin: cypressGrepPlugin } = require('@cypress/grep/plugin')
      cypressGrepPlugin(config)
      config.reporterOptions.reportDir = `report/${config.expose.cfg}/html`
      config.videosFolder = `report/${config.expose.cfg}/video`
      config.screenshotsFolder = `report/${config.expose.cfg}/html/screenshots`
      if (fs.existsSync(`./${config.expose.cfg}.ts`)) {
        require(`./${config.expose.cfg}.ts`)(config)
      }
      return config
    },
  },
})
