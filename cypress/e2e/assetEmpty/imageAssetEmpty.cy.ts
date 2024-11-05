/// <reference types="cypress" />

import { ALERT_CREATE, ASSET_TITLE, CY } from '../../utils/common'

describe(`Test image empty asset, Env: ${CY.cfg}`,
  { tags: ['@assetImageEmpty', '@assetEmpty'] }, () => {
    it('Prepare Test Data', ()=> {
      cy.prepareData('image/sample.png', 0)
    })
    it('Test empty asset', () => {
      cy.api_waitPageLoad('main')
      cy.get('.mdi-view-grid-plus-outline').click()
      cy.get('.v-list').contains('Vytvoriť prázdny asset').click()
      cy.getCy('author-type').click()
      cy.get('.v-overlay__content > .v-list').contains('Obrázok').click()
      cy.getCy('button-close').should('be.visible')
      cy.getCy('button-cancel').should('be.visible')
      cy.getCy('button-confirm').should('be.visible').click()
      cy.alertMessage(ALERT_CREATE)

      cy.urlContains('/asset')
      cy.get('.sidebar-info__content > .pa-2 > .v-alert').contains('Neobsahuje žiaden súbor')
      cy.get('.sidebar-info .v-btn').contains('Zobraziť viac').click()
      cy.getCy('button-download').should('be.visible')
      cy.getCy('button-delete').should('be.visible')
      cy.get('.dam-image-detail__sidebar [data-cy="custom-field-title"] textarea[rows]')
        .type(`${ASSET_TITLE}`)
      cy.getCy('button-save').should('be.visible').click()

      cy.getCy('button-focus').should('be.visible').click()
      cy.waitSec(1)
      cy.get('.sidebar-info__content').invoke('text').then((sidebarText) => {
        cy.wrap(sidebarText).should('include', 'Náhľady')
        cy.wrap(sidebarText).should('include', 'Náhľad obrázku na mobile, počítači alebo v aplikácii')
      })
      cy.get('.w-100 .v-btn').should('be.visible')

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
          { contents: 'cypress/fixtures/image/sample.png' },
          { waitForAnimations: true, force: true, action: 'select' }
        )
      cy.api_getFileID().then((assetID) => {
        cy.circleLoad()

        cy.visit(`/asset/${assetID}`)
        cy.circleLoad()
        cy.get('.dam-image-detail__sidebar [data-cy="custom-field-title"] textarea[rows]')
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
