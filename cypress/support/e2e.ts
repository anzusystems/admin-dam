/// <reference types="cypress" />

// commands
import '../commands/auth'
import '../commands/common'
import '../commands/api'
import '../commands/upload'

// plugins
import '@cypress/grep'
import 'cypress-mochawesome-reporter/register'

beforeEach(function () {
  //Prevent  cypress to fail on uncaught err.
  cy.failOnUncaughtException(Cypress.env('failOnUncaughtException'))
  //Cache session
  cy.session(
    `${Cypress.env('loginUser')}`,
    () => {
      //Setup protection cookie based on env
      cy.protectionCookie()
      //Login with provided user
      cy.login(`${Cypress.env('loginUser')}`)
    },
    {
      cacheAcrossSpecs: true,
    }
  )
  cy.visitBaseUrl(Cypress.env('visitBaseUrl'))
})
