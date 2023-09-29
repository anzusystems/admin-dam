/// <reference types="cypress" />

import { ALERT_CREATE, ALERT_UPDATE, CY, USER_FIRST_NAME } from '../../utils/common'

let CATEGOTY_ID = ''
describe(
  `Test distribution category function, Env: ${CY.cfg}`,
  { tags: '@distributionCategory', env: { visitBaseUrl: false } },
  () => {
    it('Create distribution category', () => {
      cy.visit('/settings')
      cy.visitSubpage('distribution-category-settings', 'distribution-category', 'Kategórie distribúcie')
      cy.getCyVisibleClick('button-create')
      cy.getCy('create-panel').should('be.visible')
      cy.getCy('category-name').should('be.visible').type(USER_FIRST_NAME)
      cy.getCy('distribution-category-select').eq(0).click()
      cy.get('.v-overlay__content > .v-list > .v-list-item').first().click()
      cy.getCy('distribution-category-select').eq(1).click()
      cy.get('.v-overlay__content > .v-list > .v-list-item').first().click()
      cy.getCy('distribution-category-select').eq(2).click()
      cy.get('.v-overlay__content > .v-list > .v-list-item').first().click()
      cy.get('body').type('{ESC}')
      cy.getCy('button-close').should('be.visible')
      cy.getCy('button-cancel').should('be.visible')
      cy.getCyVisibleClick('button-confirm')
      cy.alertMessage(ALERT_CREATE)
      cy.contains(`${USER_FIRST_NAME}`).click()
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
      //cy.getCy('filter-string').first().type(`${CATEGOTY_ID}{ENTER}`)  //todo ctrl-v(paste) in ID-filed is not working
      cy.getCy('filter-string').eq(1).type(`${USER_FIRST_NAME}{ENTER}`) //todo until bug is fixed
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
      cy.getCy('button-close').should('be.visible')
      cy.getCyVisibleClick('button-save')
      cy.alertMessage(ALERT_UPDATE)
      cy.getCyVisibleClick('button-close')
      cy.urlNotContains('/edit')
      cy.getCyVisibleClick('filter-reset')
      cy.getCy('filter-string').last().type(`${USER_FIRST_NAME}-edit{ENTER}`)
      cy.cardLoad()
      cy.contains('td', `${USER_FIRST_NAME}-edit`)
      cy.getCyVisibleClick('filter-reset')
    })
  }
)
