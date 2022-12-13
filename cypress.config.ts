import { defineConfig } from 'cypress'
declare function require(name: string): any

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
      config.env.port = ''
      const env = config.env.env || 'local'
      if (env === 'staging' || env === 'devel') {
        config.env.proto = 'https'
        config.env.domain = `${env}.sk`
      } else if (env === 'local') {
        config.env.proto = 'http'
        config.env.domain = 'anzusystems.localhost'
        config.env.port = ':8150'
      } else if (env === 'prod') {
        config.env.proto = 'https'
        config.env.domain = ''
      }
      config.baseUrl = `${config.env.proto}://admin-dam.${config.env.domain}${config.env.port}/`
      config.reporterOptions.reportDir = `report/${env}/html`
      config.videosFolder = `report/${env}/video`
      return config
    },
    specPattern: 'cypress/e2e/*.cy.ts',
    experimentalStudio: true,
    experimentalSessionAndOrigin: true,
  },
})
