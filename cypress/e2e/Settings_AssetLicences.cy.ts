/// <reference types="cypress" />

import { EXTERNAL_SYS, RAND_NUM } from './support/constants'

describe(`Test asset licences function, Env: ${Cypress.env('env')}`, { tags: 'test' }, () => {
  it('Create asset licence', () => {
    cy.visit('/settings')
    cy.verifySubPage('asset-licence-settings', 'asset-licence/list', 'List of Licenses')
    cy.getCyVisibleClick('button-create')
    cy.getCy('create-panel').should('be.visible')
    cy.getCy('asset-licence-name').type(`${EXTERNAL_SYS[0]}${RAND_NUM}`)
    cy.getCy('asset-licence-ext-id').type(`${Cypress._.repeat(RAND_NUM, 2)}`)
    cy.getCy('asset-licence-ext-system').click()
    cy.contains('.v-list-item-title', EXTERNAL_SYS[0]).click()
    cy.getCy('button-close').should('be.visible')
    cy.getCy('button-cancel').should('be.visible')
    cy.getCyVisibleClick('button-confirm')
    cy.alertMessage('Record was created')
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
    cy.visit('asset-licence/list')
    cy.getCy('filter-text').type(`${Cypress._.repeat(RAND_NUM, 2)}{ENTER}`)
    cy.wait(500)
    cy.getCyVisibleClick('table-edit')
    cy.urlContains('/edit')
    cy.getCy('asset-licence-name').find('input').clear().type(`${EXTERNAL_SYS[0]}${RAND_NUM}-edit`)
    cy.getCy('asset-licence-ext-id')
      .find('input')
      .clear()
      .type(`${Cypress._.repeat(RAND_NUM, 2)}-edit`)
    cy.getCy('asset-licence-ext-system').click()
    cy.contains('.v-list-item-title', EXTERNAL_SYS[1]).click()
    cy.getCyVisibleClick('button-save-close')
    cy.alertMessage('Record was updated')
    cy.urlNotContains('/edit')
    cy.getCyVisibleClick('filter-reset')
    cy.getCy('filter-text').type(`${Cypress._.repeat(RAND_NUM, 2)}-edit{ENTER}`)
    cy.wait(500)
    cy.contains('td', `${EXTERNAL_SYS[0]}${RAND_NUM}-edit`)
    cy.getCyVisibleClick('filter-reset')
  })
})
