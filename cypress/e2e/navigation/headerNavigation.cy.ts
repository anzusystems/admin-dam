/// <reference types="cypress" />

import { CY } from '../../utils/common'

describe(`Test header navigation menu function, Env: ${CY.cfg}`,
  { tags: ['@headerNavigation', '@navigation'], env: { visitBaseUrl: true } }, () => {
    it('Test Settings Navigation menu', () => {
      cy.api_waitPageLoad('main')
      cy.get('.v-btn .mdi-view-grid-plus-outline').should('be.visible').click()
      cy.get('.v-list-item .mdi-plus').should('be.visible').click()
      cy.get('.v-toolbar-title').invoke('text')
        .should('contain', 'Vytvoriť prázdny asset')
      cy.getCy('button-close').click()
      cy.get('[href="/podcast"]').should('be.visible').click()
      cy.urlContains('podcast')
      cy.getCy('back-to-assets-settings').should('be.visible').click()
      cy.get('.v-btn .mdi-view-grid-plus-outline').should('be.visible').click()
      cy.get('[href="/video-show"]').click()
      cy.urlContains('video-show')
      cy.getCy('back-to-assets-settings').should('be.visible').click()
      cy.get('.v-btn .mdi-view-grid-plus-outline').should('be.visible').click()
      cy.getCy('button-switch-licence').click()
      cy.get('.v-toolbar-title').invoke('text')
        .should('contain', 'Prepnutie externého systému')
      cy.getCy('button-cancel').click()
      cy.getCy('button-settings').click()
      cy.urlContains('settings')
    })
  })
