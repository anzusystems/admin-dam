/// <reference types="cypress" />
describe(`Test Log-out function, Env: ${Cypress.env('env')}`, () => {
  it('Log-out', () => {
    cy.visit('/')
    cy.getCyVisibleClick('button-user')
    cy.getCyVisibleClick('button-logout')
    cy.urlContains('login', 10000)
    cy.getCy('login-form').should('be.visible')
  })
})
