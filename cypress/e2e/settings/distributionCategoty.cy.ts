/// <reference types="cypress" />

import { ALERT_CREATE, ALERT_UPDATE, CY, USER_FIRST_NAME } from '../../utils/common'

let CATEGOTY_ID = ''
describe(`Test distribution category function, Env: ${CY.cfg}`, { env: { visitBaseUrl: false } }, () => {
  it('Create distribution category', () => {
    cy.visit('/settings')
    cy.visitSubpage('distribution-category-settings', 'distribution-category', 'Kategórie distribúcie')
    cy.getCyVisibleClick('button-create')
    cy.getCy('create-panel').should('be.visible')
    cy.getCy('category-name').should('be.visible').type(USER_FIRST_NAME)
    cy.getCy('distribution-category-select').eq(0).click()
    cy.contains('.v-list-item-title', /^Dokumenty$/).click()
    cy.getCy('distribution-category-select').eq(1).click()
    cy.contains('.v-list-item-title', /^Sports$/).click()
    cy.getCy('distribution-category-select').eq(2).click()
    cy.contains('.v-list-item-title', /^Comedy$/).click()
    cy.getCy('button-close').should('be.visible')
    cy.getCy('button-cancel').should('be.visible')
    cy.getCyVisibleClick('button-confirm')
    cy.alertMessage(ALERT_CREATE)
    cy.getCy('filter-submit').click() // until bug is fixed
    cy.contains(`${USER_FIRST_NAME}`).click() // until bug is fixed
    cy.cardLoad()
    cy.getCy('copy-text')
      .invoke('text')
      .then((text) => {
        cy.urlContains(text)
        cy.getCyVisibleClick('button-close')
        cy.urlNotContains(text)
        cy.urlContains('/distribution-category')
        CATEGOTY_ID = text
      })
  })
  it('Edit distribution category', () => {
    cy.visit('distribution-category')
    cy.getCy('filter-string').first().type(`${CATEGOTY_ID}{ENTER}`)
    cy.cardLoad()
    cy.getCyVisibleClick('table-edit')
    cy.urlContains('/edit')
    // eslint-disable-next-line cypress/unsafe-to-chain-command
    cy.getCy('category-name').find('input').clear().type(`${USER_FIRST_NAME}-edit`)
    cy.getCy('distribution-category-select').eq(0).click()
    cy.contains('.v-list-item-title', /^Spravodajstvo$/).click()
    cy.getCy('distribution-category-select').eq(1).click()
    cy.contains('.v-list-item-title', /^Science$/).click()
    cy.getCy('distribution-category-select').eq(2).click()
    cy.contains('.v-list-item-title', /^Drama$/).click()
    cy.getCyVisibleClick('button-save-close')
    cy.alertMessage(ALERT_UPDATE)
    cy.urlNotContains('/edit')
    cy.getCyVisibleClick('filter-reset')
    cy.getCy('filter-string').last().type(`${USER_FIRST_NAME}-edit{ENTER}`)
    cy.cardLoad()
    cy.contains('td', `${USER_FIRST_NAME}-edit`)
    cy.getCyVisibleClick('filter-reset')
  })
})
