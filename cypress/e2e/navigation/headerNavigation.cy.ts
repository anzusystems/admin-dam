/// <reference types="cypress" />

import { CY } from '../../utils/common'

describe(`Test header navigation menu function, Env: ${CY.cfg}`,
  { tags: '@assetAudioLicence', env: { visitBaseUrl: true } }, () => {
    it('Test Settings Navigation menu', () => {
      cy.api_waitPageLoad('main')
      cy.getCy('button-main').should('be.visible').click()
      cy.getCy('button-main-empty-asset').should('be.visible').click()
      cy.get('.v-toolbar-title').invoke('text')
        .should('contain', 'Vytvoriť prázdny asset')
      cy.getCy('button-close').should('be.visible').click()
      cy.getCy('button-main-podcast').should('be.visible').click()
      cy.urlContains('podcast')
      cy.getCy('back-to-assets-settings').should('be.visible').click()
      cy.getCy('button-main').should('be.visible').click()
      cy.getCy('button-main-video-show').click()
      cy.urlContains('video-show')
      cy.getCy('back-to-assets-settings').should('be.visible').click()
      cy.getCy('button-main').should('be.visible').click()
      cy.getCy('button-switch-licence').click()
      cy.get('.v-toolbar-title').invoke('text')
        .should('contain', 'Prepnutie externého systému')
      cy.getCy('button-cancel').should('be.visible').click()
      cy.getCy('button-settings').click()
      cy.urlContains('settings')
    })
  })
