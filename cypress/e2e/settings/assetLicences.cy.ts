/// <reference types="cypress" />

import { ALERT_CREATE, ALERT_UPDATE, CY, EXTERNAL_SYS, RAND_NUM } from '../../utils/common'

let LICENCE_ID = ''
describe(
  `Test asset licences function, Env: ${CY.cfg}`,
  { tags: ['@assetLicence', '@settings'], env: { visitBaseUrl: false } },
  () => {
    it('Create asset licence', () => {
      cy.visit('/settings')
      cy.visitSubpage('asset-licence-settings', 'asset-licence', 'Licencie assetov')
      cy.getCyVisibleClick('button-create')
      cy.getCy('create-panel').should('be.visible')
      cy.getCy('asset-licence-name').type(`${EXTERNAL_SYS[0]}${RAND_NUM}`)
      cy.getCy('asset-licence-ext-id').type(`${Cypress._.repeat(RAND_NUM, 2)}`)
      cy.getCy('asset-licence-ext-system').click()
      cy.contains('.v-list-item-title', EXTERNAL_SYS[0]).click()
      cy.getCy('button-close').should('be.visible')
      cy.getCy('button-cancel').should('be.visible')
      cy.getCy('button-confirm').click()
      cy.alertMessage(ALERT_CREATE)
      cy.contains(`${EXTERNAL_SYS[0]}${RAND_NUM}`).click()
      cy.cardLoad()
      cy.getCy('copy-text')
        .invoke('text')
        .then((text) => {
          cy.urlContains(text)
          cy.getCyVisibleClick('button-close')
          cy.urlNotContains(text)
          cy.urlContains('/asset-licence')
          LICENCE_ID = text
        })
    })
    it('Edit asset licence', () => {
      cy.visit('asset-licence')
      cy.getCy('filter-integer', 10000).first().type(`${LICENCE_ID}{ENTER}`)
      cy.cardLoad()
      cy.getCyVisibleClick('table-edit')
      cy.urlContains('/edit')
      cy.getCy('asset-licence-name').find('input').clear().type(`${EXTERNAL_SYS[0]}${RAND_NUM}-edit`)
      cy.getCy('asset-licence-ext-id')
        .find('input')
        .clear()
        .type(`${Cypress._.repeat(RAND_NUM, 2)}-edit`)
      cy.getCy('asset-licence-ext-system').click()
      cy.contains('.v-list-item-title', EXTERNAL_SYS[1]).click()
      cy.getCyVisibleClick('button-save')
      cy.alertMessage(ALERT_UPDATE)
      cy.getCyVisibleClick('button-close')
      cy.urlNotContains('/edit')
      cy.getCyVisibleClick('filter-reset')
      cy.getCy('filter-string')
        .last()
        .type(`${Cypress._.repeat(RAND_NUM, 2)}-edit{ENTER}`)
      cy.cardLoad()
      cy.contains('td', `${EXTERNAL_SYS[0]}${RAND_NUM}-edit`)
      cy.getCyVisibleClick('filter-reset')
    })
  }
)
