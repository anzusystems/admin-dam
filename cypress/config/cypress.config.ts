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
    grepFilterSpecs: true,
    grepOmitFiltered: true,
    credentials: {
      admin: {
        username: 'dam_admin@anzusystems.dev',
        password: 'root',
      },
    },
  },
  e2e: {
    baseUrl: 'http://admin-dam.anzusystems.localhost:8150/',
    specPattern: 'cypress/e2e/*.cy.ts',
    setupNodeEvents(on, config) {
      require('cypress-mochawesome-reporter/plugin')(on)
      require('@cypress/grep/src/plugin')(config)
      config.reporterOptions.reportDir = `cypress/report/${config.env.env}/html`
      config.videosFolder = `cypress/report/${config.env.env}/video`
      if (fs.existsSync(`./${config.env.env}.ts`)) {
        require(`./${config.env.env}.ts`)(config)
      }
      return config
    },
  },
})
