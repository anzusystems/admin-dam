/// <reference types="cypress" />

import { ALERT_UPDATE, CY, RAND_NUM, USER_FIRST_NAME, USER_LAST_NAME } from '../../utils/common'
let ID = ''
describe(`Test distribution category select function, Env: ${CY.cfg}`, { env: { visitBaseUrl: false } }, () => {
  it('Create distribution category select', () => {
    cy.visit('/settings')
    cy.visitSubpage(
      'distribution-category-select-settings',
      'distribution-category-select',
      'Výbery v distribučných kategóriách'
    )
    cy.get('.v-data-table__tr').first().click()
    cy.cardLoad()
    cy.getCy('copy-text')
      .invoke('text')
      .then((text) => {
        cy.urlContains(text)
        ID = text
      })
    cy.getCyVisibleClick('button-edit')
    cy.getCyVisibleClick('button-add-option')
    cy.getCy('option-name').last().type(USER_FIRST_NAME)
    cy.getCy('option-assignable').last().click()
    cy.getCy('option-id').last().type(RAND_NUM)
    cy.getCy('button-close').should('be.visible')
    cy.getCyVisibleClick('button-save')
    cy.alertMessage(ALERT_UPDATE)
    // eslint-disable-next-line cypress/unsafe-to-chain-command
    cy.getCy('option-name').last().find('input').clear().type(USER_LAST_NAME)
    cy.getCy('option-assignable').last().click()
    // eslint-disable-next-line cypress/unsafe-to-chain-command
    cy.getCy('option-id').last().find('input').clear().type(`${Date.now()}`)
    cy.getCyVisibleClick('button-save')
    cy.alertMessage(ALERT_UPDATE)
    cy.getCyVisibleClick('button-close')
    cy.urlNotContains('/edit')
  })
  it('Delete distribution category select', () => {
    cy.visit(`/distribution-category-select/${ID}/edit`)
    cy.cardLoad()
    cy.get('.v-input__append').last().click()
    cy.getCyVisibleClick('button-save')
    cy.alertMessage(ALERT_UPDATE)
  })
})
