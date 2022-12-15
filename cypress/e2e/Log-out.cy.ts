/// <reference types="cypress" />

// @ts-ignore
describe(`Test Log-out function, Env: ${Cypress.env('domain')}`, { tags: '@logout' }, () => {
  it('Log-out', () => {
    cy.visit('/')
    cy.fixture('credentials').then((credentials) => {
      cy.getCyVisibleClick('button-user')
      cy.getCy('user-email').should('contain', `${credentials.admin.username}`)
      cy.getCyVisibleClick('button-logout')
      cy.urlContains('login', 10000)
      cy.getCy('login-form').should('be.visible')
    })
  })
})
