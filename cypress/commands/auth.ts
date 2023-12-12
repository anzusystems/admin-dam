/// <reference types="cypress" />

import { CY } from '../utils/common'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      /**
       * Provide user credentials form config/cypress.config.ts env to login, if they don't exist, use provided values.
       * @param user - username
       * @param timeout - timeout for command
       */
      login(user: string, timeout?: number): Chainable<any>
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

Cypress.Commands.add('login', (user: string, timeout?: number) => {
  cy.visit(CY.credentials[user].forceLoginLink, { timeout: timeout })
})

export {}
