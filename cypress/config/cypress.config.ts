/* eslint @typescript-eslint/no-var-requires: "off" */
import { defineConfig } from 'cypress'
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
  videoUploadOnPasses: false,
  watchForFileChanges: false,
  viewportHeight: 1080,
  viewportWidth: 1920,
  retries: {
    runMode: 1,
  },
  env: {
    cfg: 'local',
    loginUser: 'admin',
    failOnUncaughtException: false,
    visitBaseUrl: true,
    grepFilterSpecs: true,
    grepOmitFiltered: true,
    grepIntegrationFolder: '../../',
  },
  e2e: {
    baseUrl: 'http://admin-dam.anzusystems.localhost:8150/',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    setupNodeEvents(on, config) {
      require('cypress-mochawesome-reporter/plugin')(on)
      require('@cypress/grep/src/plugin')(config)
      config.reporterOptions.reportDir = `cypress/report/${config.env.cfg}/html`
      config.videosFolder = `cypress/report/${config.env.cfg}/video`
      config.screenshotsFolder = `cypress/report/${config.env.cfg}/html/screenshots`
      if (fs.existsSync(`./${config.env.cfg}.ts`)) {
        require(`./${config.env.cfg}.ts`)(config)
      }
      return config
    },
  },
})
