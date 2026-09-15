import { defineConfig } from 'cypress'
import { downloadFile } from 'cypress-downloadfile/lib/addPlugin.js'
import * as fs from 'fs'

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
  env: {
    cfg: 'stg', // local or stg
    loginUser: 'admin',
    failOnUncaughtException: false,
    visitBaseUrl: true,
    grepFilterSpecs: true,
    grepOmitFiltered: true,
    grepIntegrationFolder: '../../',
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
      on('task', { downloadFile })
      require('cypress-mochawesome-reporter/plugin')(on)
      require('@cypress/grep/src/plugin')(config)
      config.reporterOptions.reportDir = `report/${config.env.cfg}/html`
      config.videosFolder = `report/${config.env.cfg}/video`
      config.screenshotsFolder = `report/${config.env.cfg}/html/screenshots`
      if (fs.existsSync(`./${config.env.cfg}.ts`)) {
        require(`./${config.env.cfg}.ts`)(config)
      }
      return config
    },
  },
})
