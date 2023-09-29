/// <reference types="cypress" />

import { CY } from '../utils/common'

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
  if (CY.cookie != undefined) {
    cy.setCookie(CY.cookie.name, CY.cookie.value, {
      domain: CY.url.domain,
      log: false,
    })
  }
})

Cypress.Commands.add('login', (user: string, password?: string, timeout?: number) => {
  if (user != 'anonym') {
    if (CY.credentials[user].isForceLogin === true) {
      cy.visit(CY.credentials[user].forceLoginLink, { timeout: timeout })
    } else {
      cy.visit('/')
      cy.getCy('login-form').should('be.visible') // central.sme.localhost
      cy.getCy('username').type(CY.credentials[user].name || user)
      cy.getCy('password').type(CY.credentials[user].password || password)
      cy.getCyVisibleClick('button-login')
    }
  }

})

export {}
