/// <reference types="cypress" />

import './commands'
import '@cypress/grep'
import 'cypress-mochawesome-reporter/register'

beforeEach(function () {
  cy.session(
    'login',
    () => {
      //Set cookies based on config
      if (Cypress.env('domain') === 'smedevel.sk') {
        cy.setDevCookie()
      } else if (Cypress.env('domain') === 'smestaging.sk') {
        cy.setStgCookie()
      }
      //Prevent  cypress to fail on uncaught err.
      Cypress.on('uncaught:exception', () => {
        return false
      })
      cy.login('admin')
    },
    {
      cacheAcrossSpecs: true,
    }
  )
})
