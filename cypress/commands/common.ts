/// <reference types="cypress" />

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      /**
       * Test wait for response url to continue
       * @param response response URL
       * @param timeout - timeout for command
       */
      waitResponse(response: string, timeout?: number): Chainable<any>
      /**
       * Wait for X seconds
       * @param sec - Length in sec
       */
      waitSec(sec: number): Chainable<any>
      /**
       * Extended selector for selecting only data-cy values.
       * @param selector - data-cy value as string
       * @param timeout - timeout for command get
       */
      getCy(selector: string, timeout?: number): Chainable<any>
      /**
       * Gets data-cy any check if it is visible and click on it.
       * @param selector
       * @param timeout
       */
      getCyVisibleClick(selector: string, timeout?: number): Chainable<any>
      /**
       * Gets current URL and check if it contains provided string
       * @param string part of url
       * @param timeout - timeout for command get
       */
      urlContains(string: string, timeout?: number): Chainable<any>
      /**
       * Gets current URL and check if it not contains provided string
       * @param string part of url
       */
      urlNotContains(string: string): Chainable<any>
      /**
       * Check if alert show up and display correct message
       * @param message text of alert message
       */
      alertMessage(message: string): Chainable<any>
      /**
       * Visit base URL
       * @param timeout
       * @param value - [true/false] if true visit base url
       */
      visitBaseUrl(value: boolean, timeout?: number): Chainable<any>
      /**
       * Decide if cypress fails on uncaught exception in console.
       * @param option - true or false
       */
      failOnUncaughtException(option: boolean): Chainable<any>
    }
  }
}

Cypress.Commands.add('waitResponse', (request: string, timeout?: number) => {
  cy.log(`Wait for response: ${request}`)
  cy.intercept(request, {}).as('waitResponse')
  cy.wait('@waitResponse', { timeout: timeout })
})

Cypress.Commands.add('waitSec', (sec: number) => {
  cy.log(`Wait for ${sec * 1000} sec`)
  cy.wait(sec * 1000)
})

Cypress.Commands.add('getCy', (selector: string, timeout?: number) => {
  cy.get(`[data-cy='${selector}']`, { timeout: timeout })
})

Cypress.Commands.add('getCyVisibleClick', (selector: string, timeout?: number) => {
  cy.get(`[data-cy='${selector}']`, { timeout: timeout }).should('be.visible').click()
})

Cypress.Commands.add('urlContains', (string: string, timeout?: number) => {
  cy.url({ timeout: timeout }).should('contain', string)
})

Cypress.Commands.add('urlNotContains', (string: string) => {
  cy.url().should('not.contain', string)
})

Cypress.Commands.add('alertMessage', (message: string) => {
  cy.log(`Expect alert message: ${message}`)
  cy.get('.v-alert').should('be.visible').and('contain.text', `${message}`)
  cy.get('.v-alert__close').click()
})

Cypress.Commands.add('visitBaseUrl', (value?: boolean, timeout?: number) => {
  if (value) {
    cy.visit('/', { timeout: timeout })
  }
})

Cypress.Commands.add('failOnUncaughtException', (option) => {
  Cypress.on('uncaught:exception', (err) => {
    cy.log(`Uncaught exception: ${err}`)
    return option
  })
})

export {}
