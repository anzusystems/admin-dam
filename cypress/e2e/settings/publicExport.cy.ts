/// <reference types="cypress" />

import { ALERT_CREATE, ALERT_UPDATE, CY } from '../../utils/common'
let PUBLIC_EXPORT_ID = ''

describe(`Test public export function, Env: ${CY.cfg}`,
  { tags: ['@publicExport', '@settings'], env: { visitBaseUrl: false } }, () => {
    it('Create public export', () => {
      cy.visit('/public-export')
      cy.getCy('button-create').click()
      cy.getCy('publicExport-slug').type('cms-cypress')
      cy.getCy('user-asset-licences').type('Sme Family').click()
      cy.get('.v-list-item').contains('Sme Family').click()
      cy.getCy('button-confirm').click()
      cy.alertMessage(ALERT_CREATE)
      cy.getCy('filter-string').eq(1).type('cms-cypress')
      cy.getCy('filter-submit').click()
      cy.get('td').contains('cms-cypress').click()
      cy.cardLoad()
      cy.getCy('copy-text')
        .invoke('text')
        .then((text) => {
          cy.urlContains(text)
          cy.getCyVisibleClick('button-close')
          cy.urlNotContains(text)
          cy.urlContains('/public-export')
          PUBLIC_EXPORT_ID = text
        })
    })

    it('Edit public export', () => {
      cy.visit(`/public-export/${PUBLIC_EXPORT_ID}`)
      cy.cardLoad()
      cy.get('.v-col').contains('cms-cypress')
      cy.get('.v-col').contains('Web')
      cy.get('.v-col').contains('Sme Family')
      cy.getCy('button-edit').click()
      cy.urlContains('/edit')
      cy.get('.v-progress-linear').should('not.be.visible')
      cy.getCy('publicExport-slug').type(`-edit`)
      cy.getCy('publicExport-licence').click()
      cy.get('.v-list-item').contains('Blog system').first().click()
      cy.getCy('publicExport-type').click()
      cy.get('.v-list-item').contains('Appka').click()
      cy.getCy('button-save').click()
      cy.alertMessage(ALERT_UPDATE)
      cy.urlNotContains('/edit')
      cy.get('.v-col').contains('cms-cypress-edit')
      cy.get('.v-col').contains('Appka')
      cy.get('.v-col').contains('Blog system')
    })

    it('Delete public export', () => {
      cy.visit(`/public-export/${PUBLIC_EXPORT_ID}`)
      cy.cardLoad()
      cy.getCy('button-delete').click()
      cy.getCy('button-confirm-delete').click()
      cy.alertMessage(ALERT_UPDATE)
    })
  })
