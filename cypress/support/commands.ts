/// <reference types="cypress" />

// eslint-disable-next-line @typescript-eslint/no-namespace
declare namespace Cypress {
  interface Chainable {
    /**
     * Setup protection cookie based on env
     */
    protectionCookie(): Chainable<Element>

    /**
     * Wait for X seconds
     * @param sec - Length in sec
     */
    waitSec(sec: number): Chainable<Element>

    /**
     * Extended selector for selecting only data-cy values.
     * @param selector - data-cy value as string
     * @param timeout - timeout for command get
     */
    getCy(selector: string, timeout?: number): Chainable<Element>

    /**
     * Provide user credentials form config/cypress.config.ts env to login.
     * @param user User name
     * @param timeout - timeout for command
     */
    login(user: string, timeout?: number): Chainable<Element>

    /**
     * Gets current URL and check if it contains provided string
     * @param string part of url
     * @param timeout - timeout for command get
     */
    urlContains(string: string, timeout?: number): Chainable<Element>

    /**
     * Gets current URL and check if it not contains provided string
     * @param string part of url
     */
    urlNotContains(string: string): Chainable<Element>

    /**
     * Test wait for response url to continue
     * @param response response URL
     * @param timeout - timeout for command
     */
    waitResponse(response: string, timeout?: number): Chainable<Element>

    /**
     * Check if alert show up and display correct message
     * @param message text of alert message
     */
    alertMessage(message: string): Chainable<Element>

    /**
     * Gets data-cy element check if it is visible and click on it.
     * @param selector
     * @param timeout
     */
    getCyVisibleClick(selector: string, timeout?: number): Chainable<Element>
    verifySubPage(selector: string, url: string, title: string): Chainable<Element>
  }
}

Cypress.Commands.add('protectionCookie', () => {
  if (Cypress.env('cookie') != undefined) {
    cy.setCookie(Cypress.env('cookie').name, Cypress.env('cookie').value, {
      domain: Cypress.env('cookie').domain,
      log: false,
    })
  }
})
Cypress.Commands.add('verifySubPage', (selector: string, url: string, title: string) => {
  cy.getCyVisibleClick(selector)
  cy.urlContains(url)
  cy.contains('[data-cy="page-title"]', title)
})
Cypress.Commands.add('getCyVisibleClick', (selector: string, timeout?: number) => {
  cy.get(`[data-cy='${selector}']`, { timeout: timeout }).should('be.visible').click()
})
Cypress.Commands.add('waitSec', (sec: number) => {
  cy.wait(sec * 1000)
})
Cypress.Commands.add('getCy', (selector: string, timeout?: number) => {
  cy.get(`[data-cy='${selector}']`, { timeout: timeout })
})

Cypress.Commands.add('login', (user: string, timeout?: number) => {
  cy.visit('/')
  cy.getCy('login-form').should('be.visible')
  cy.getCy('username').find('input').clear().type(Cypress.env('credentials')[user].username)
  cy.getCy('password').find('input').clear().type(Cypress.env('credentials')[user].password)
  cy.getCyVisibleClick('button-login')
  cy.urlContains('asset/list', timeout)
})
Cypress.Commands.add('urlContains', (string: string, timeout?: number) => {
  cy.url({ timeout: timeout }).should('contain', string)
})
Cypress.Commands.add('urlNotContains', (string: string) => {
  cy.url().should('not.contain', string)
})
Cypress.Commands.add('waitResponse', (request: string, timeout?: number) => {
  cy.intercept(request, {}).as('waitResponse')
  cy.wait('@waitResponse', { timeout: timeout })
})
Cypress.Commands.add('alertMessage', (message: string) => {
  cy.get('.v-alert').should('be.visible').and('contain.text', `${message}`)
  cy.get('.v-alert__close').click()
})
