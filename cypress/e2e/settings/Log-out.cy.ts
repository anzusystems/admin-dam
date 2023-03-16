/// <reference types="cypress" />
describe(`Test Log-out function, Env: ${Cypress.env('cfg')}`, () => {
  it('Log-out', () => {
    cy.visit('/')
    cy.getCyVisibleClick('button-user')
    cy.getCyVisibleClick('button-logout')
    cy.urlContains('login', 10000)
    cy.get('.v-btn').should('be.visible')
  })
})
