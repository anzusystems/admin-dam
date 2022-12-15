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
  env: {
    grepFilterSpecs: true,
    grepOmitFiltered: true,
  },
  retries: {
    runMode: 1,
  },
  e2e: {
    setupNodeEvents(on, config) {
      require('cypress-mochawesome-reporter/plugin')(on)
      require('@cypress/grep/src/plugin')(config)
      config.reporterOptions.reportDir = `/cypress/report/${config.env.env}/html`
      config.videosFolder = `cypress/report/${config.env.env}/video`
      config.screenshotsFolder = `cypress/report/${config.env.env}/assets`
      if (fs.existsSync(`./${config.env.env}.ts`)) {
        require(`./${config.env.env}.ts`)(config)
      }
      return config
    },
    baseUrl: 'http://admin-dam.anzusystems.localhost:8150/',
    specPattern: 'cypress/e2e/*.cy.ts',
  },
})
