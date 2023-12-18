/// <reference types="cypress" />

import { ALERT_CREATE, ASSET_TITLE, CY } from '../../utils/common'

describe(`Test document empty asset, Env: ${CY.cfg}`,
  { tags: ['@assetDocumentEmpty', '@assetEmpty'] }, () => {
    it('Prepare Test Data', ()=> {
      cy.prepareData('document/sample.doc', 0)
    })
    it('Test empty asset', () => {
      cy.api_waitPageLoad('main')
      cy.get('.mdi-view-grid-plus-outline').click()
      cy.get('.v-list').contains('Vytvoriť prázdny asset').click()
      cy.getCy('author-type').click()
      cy.get('.v-overlay__content > .v-list').contains('Dokument').click()
      cy.getCy('button-close').should('be.visible')
      cy.getCy('button-cancel').should('be.visible')
      cy.getCy('button-confirm').should('be.visible').click()
      cy.alertMessage(ALERT_CREATE)

      cy.urlContains('/asset')
      cy.get('.sidebar-info__content > .pa-2 > .v-alert').contains('Neobsahuje žiaden súbor')
      cy.getCy('button-download').should('be.visible')
      cy.getCy('button-delete').should('be.visible')
      cy.get('.dam-image-detail__sidebar [data-cy="custom-field-title"] textarea').eq(0)
        .type(`${ASSET_TITLE}`)
      cy.getCy('button-save').should('be.visible').click()

      cy.getCy('button-slots').should('be.visible').click()
      cy.circleLoad()
      cy.get('.sidebar-info__content').invoke('text').then((sidebarText) => {
        cy.wrap(sidebarText).should('include', 'Neobsahuje žiaden súbor')
        cy.wrap(sidebarText).should('include', 'default')
        cy.wrap(sidebarText).should('include', 'Žiaden súbor')
      })
      cy.get('.w-100 > .v-btn').should('be.visible')
      cy.get('.sidebar-info__content input[type="file"]', { timeout: 10000 })
        .eq(0)
        .selectFile(
          { contents: 'cypress/fixtures/document/sample.doc' },
          { waitForAnimations: true, force: true, action: 'select' }
        )
      cy.api_getFileID().then((assetID) => {
        cy.circleLoad()

        cy.visit(`/asset/${assetID}`)
        cy.circleLoad()
        cy.get('.dam-image-detail__sidebar [data-cy="custom-field-title"] textarea').eq(0)
          .invoke('val').then((assetTitle)=>{
          cy.wrap(assetTitle).should('include', ASSET_TITLE)
        })
        cy.urlContains(assetID)
        cy.get('.sidebar-info__content').invoke('text').then((sidebarText) => {
          cy.wrap(sidebarText).should('not.include', 'Neobsahuje žiaden súbor')
        }).then(()=>{
          cy.deleteFile([assetID])
        })
      })
    })
  })
