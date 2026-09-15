/// <reference types="cypress" />

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      /**
       * Click on selector and verify URL, page title.
       * @param selector data-cy selector for navigation
       * @param url part of URL to verify
       * @param title page title to verify
       */
      visitSubpage(selector: string, url: string, title?: string): Chainable<any>

      /**
       * Verify if navbar is visible
       */
      navbarVisible(): Chainable<any>

      /**
       * Grands cypress access to clipboard
       */
      clipboardPermission(): Chainable<any>

      /**
       * @param selector data-cy value
       */
      moduleVisible(selector: string): Chainable<any>
      /**
       * Wait for card to load
       */
      cardLoad(): Chainable<any>
      /**
       * Wait for circle to load
       */
      circleLoad(): Chainable<any>
      /**
       * Wait for line to load
       */
      lineLoad(): Chainable<any>
      /**
       * Change Admin to Slovak language and dark theme
       */
      changeToSlovakDarkTheme(): Chainable<any>
    }
  }
}

Cypress.Commands.add('visitSubpage', (selector: string, url: string, title?: string) => {
  cy.navbarVisible()
  cy.moduleVisible(selector)
  cy.getCy(selector).first().should('be.visible').click()
  cy.get('.v-breadcrumbs-item__text').should('contain.text', title)
  cy.get('.v-container').should('exist').and('be.visible')
  cy.urlContains(url)
})

Cypress.Commands.add('navbarVisible', () => {
  cy.get('.v-navigation-drawer', { timeout: 10000 }).then((navbar) => {
    if (!navbar.is(':visible')) {
      cy.getCy('navbar-collapse').click()
    }
  })
})

Cypress.Commands.add('moduleVisible', (selector: string) => {
  cy.get(`[data-cy="${selector}"]`).then((module) => {
    if (!module.is(':visible')) {
      const newSelector = `${selector.split('-')[0]}-${selector.split('-')[1]}`
      cy.getCy(`${newSelector}`).first().click()
    }
  })
})

Cypress.Commands.add('clipboardPermission', () => {
  Cypress.automation('remote:debugger:protocol', {
    command: 'Browser.grantPermissions',
    params: {
      permissions: ['clipboardReadWrite', 'clipboardSanitizedWrite'],
      origin: window.location.origin,
    },
  })
})

Cypress.Commands.add('cardLoad', () => {
  cy.get('.a-card-loader', { timeout: 10000 }).should('be.visible')
  cy.get('.a-card-loader', { timeout: 10000 }).should('not.be.visible')
})

Cypress.Commands.add('circleLoad', () => {
  cy.get('.v-progress-circular', { timeout: 10000 }).should('exist')
  cy.get('.v-progress-circular', { timeout: 10000 }).should('not.exist')
})

Cypress.Commands.add('lineLoad', () => {
  cy.get('.v-progress-linear', { timeout: 10000 }).should('exist')
  cy.get('.v-progress-linear', { timeout: 10000 }).should('not.exist')
})

Cypress.Commands.add('changeToSlovakDarkTheme', () => {
  cy.window().then((win) => {
    win.localStorage.setItem('theme', 'dark')
    win.localStorage.setItem('language', 'sk')
  })
})

export {}
