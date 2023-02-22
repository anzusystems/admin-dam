/// <reference types="cypress" />

import './commands'
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
      cy.login('admin', 20000)
    },
    {
      cacheAcrossSpecs: true,
    }
  )
  cy.visitBaseUrl('/', 10000, Cypress.env('visitBaseUrl'))
})
