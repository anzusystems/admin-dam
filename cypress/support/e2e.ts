/// <reference types="cypress" />

import './commands'
import '@cypress/grep'
import 'cypress-mochawesome-reporter/register'

beforeEach(function () {
  cy.session(
    'login',
    () => {
      //Setup protection cookie based on env
      cy.protectionCookie()
      //Prevent  cypress to fail on uncaught err.
      Cypress.on('uncaught:exception', () => {
        return false
      })
      cy.login('admin', 20000)
    },
    {
      cacheAcrossSpecs: true,
    }
  )
})
