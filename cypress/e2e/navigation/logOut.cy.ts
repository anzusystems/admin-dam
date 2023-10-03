/// <reference types="cypress" />
import { CY } from '../../utils/common'

describe(`Test Log-out function, Env: ${CY.cfg}`, () => {
  it('Log-out', () => {
    cy.getCyVisibleClick('navbar-user', 10000)
    cy.getCyVisibleClick('navbar-user-logout')
    cy.getCyVisibleClick('button-confirm')
    cy.get('.v-btn')
      .should('be.visible')
      .invoke('text')
      .should('eq', ' Log in ')
  })
})
