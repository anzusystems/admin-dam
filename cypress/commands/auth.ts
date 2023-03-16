/// <reference types="cypress" />

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      /**
       * Provide user credentials form config/cypress.config.ts env to login, if they don't exist, use provided values.
       * @param user - username
       * @param password - password for user
       * @param timeout - timeout for command
       */
      login(user: string, password?: string, timeout?: number): Chainable<any>
      /**
       * Clear all cookies, local storage, session storage and set protection cookie
       */
      clearAll(): Chainable<any>
      /**
       * Setup protection cookie based on env
       */
      protectionCookie(): Chainable<any>
      createUser(userMail: string, clientSecret: string): Chainable<any>
    }
  }
}

Cypress.Commands.add('protectionCookie', () => {
  if (Cypress.env('cookie') != undefined) {
    cy.setCookie(Cypress.env('cookie').name, Cypress.env('cookie').value, {
      domain: Cypress.env('url').domain,
      log: false,
    })
  }
})

Cypress.Commands.add('login', (user: string, password?: string, timeout?: number) => {
  if (user != 'anonym') {
    if ('forceLoginLink' in Cypress.env('credentials')[user]) {
      cy.visit(Cypress.env('credentials')[user].forceLoginLink, { timeout: timeout })
    } else {
      cy.visit('/')
      cy.getCy('login-form').should('be.visible')
      cy.getCy('username').type(Cypress.env('credentials')[user].username || user)
      cy.getCy('password').type(Cypress.env('credentials')[user].password || password)
      cy.getCyVisibleClick('button-login')
    }
  }
})

export {}
