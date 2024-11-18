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
       * Login to sme web
       * Provide user credentials form config/cypress.config.ts env to login
       * @param username - username
       * @param password - password
       */
      webLogin(username: string, password: string): Chainable<any>
    }
  }
}

Cypress.Commands.add('login', (user: string, timeout?: number) => {
  cy.visit(CY.credentials[user].forceLoginLink, { timeout: timeout })
})

Cypress.Commands.add('webLogin', (username: string, password: string) => {
  cy.request(`${CY.url.proto}://prihlasenie.${CY.url.domain}/get-csrf-token/login`).then((csrfToken) => {
    cy.request({
      method: 'POST',
      url: `${CY.url.proto}://prihlasenie.${CY.url.domain}/login_check`,
      body: {
        username: username,
        password: password,
        _token: csrfToken.body,
      },
      form: true,
    })
  })
})

export {}
