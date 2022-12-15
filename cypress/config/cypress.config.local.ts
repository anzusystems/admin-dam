import { defineConfig } from 'cypress'

declare function require(name: string): any // todo

export default defineConfig({
  projectId: '',
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
  screenshotsFolder: './cypress/assets',
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
      console.log(config)
      config.baseUrl = 'http://admin-dam.anzusystems.localhost:8150/'
      config.reporterOptions.reportDir = '/cypress/report/html'
      config.videosFolder = 'cypress/report/video'
      config.screenshotsFolder = 'cypress/report/assets'
      return config
    },
    specPattern: 'cypress/e2e/*.cy.ts',
    experimentalStudio: true,
  },
})
