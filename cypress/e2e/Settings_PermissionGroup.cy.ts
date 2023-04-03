/// <reference types="cypress" />

import { PERMISSION_GROUP } from './support/constants'

describe(`Test permission groups function, Env: ${Cypress.env('env')}`, () => {
  it('Create permission group', () => {
    cy.visit('/settings')
    cy.verifySubPage('permission-group-settings', 'permission-group/list', 'List of Permission Groups')
    cy.getCyVisibleClick('button-create')
    cy.getCy('create-panel').should('be.visible')
    cy.getCy('permission-group-title').type(PERMISSION_GROUP)
    cy.getCy('permission-group-description').type(Cypress._.repeat(PERMISSION_GROUP, 3))
    cy.getCy('button-close').should('be.visible')
    cy.getCy('button-cancel').should('be.visible')
    cy.getCyVisibleClick('button-confirm')
    cy.alertMessage('Record was created')
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(1000)
    cy.getCy('copy_text')
      .invoke('text')
      .then((text) => {
        cy.urlContains(text)
        cy.getCyVisibleClick('button-close')
        cy.urlNotContains(text)
        cy.urlContains('/asset-licence/list')
      })
  })
  it('Edit asset licence', () => {
    cy.visit('permission-group/list')
    cy.getCy('filter-text').type(`${PERMISSION_GROUP}{ENTER}`)
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(500)
    cy.getCyVisibleClick('table-edit')
    cy.urlContains('/edit')
    // eslint-disable-next-line cypress/unsafe-to-chain-command
    cy.getCy('permission-group-title').find('input').clear().type(`${PERMISSION_GROUP}-edit`)
    // eslint-disable-next-line cypress/unsafe-to-chain-command
    cy.getCy('permission-group-description')
      .find('input')
      .clear()
      .type(`${Cypress._.repeat(PERMISSION_GROUP, 3)}-edit`)
    cy.getCyVisibleClick('button-save-close')
    cy.alertMessage('Record was updated')
    cy.urlNotContains('/edit')
    cy.getCyVisibleClick('filter-reset')
    cy.getCy('filter-text').type(`${PERMISSION_GROUP}-edit{ENTER}`)
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(500)
    cy.contains('td', `${PERMISSION_GROUP}-edit`)
    cy.getCyVisibleClick('filter-reset')
  })
})
