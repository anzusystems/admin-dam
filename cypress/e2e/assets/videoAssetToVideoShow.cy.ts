/// <reference types="cypress" />

import { ALERT_UPDATE, CY, ASSET_TITLE, ASSET_DESCRIPTION, ALERT_CREATE, VIDEO_SHOW_TITLE } from '../../utils/common'
const ASSET_ID: Array<string> = []

describe(`Test add video asset to video show episode  function, Env: ${CY.cfg}`,
  { tags: '@assetVideoToVideoShow' }, () => {
    it('Prepare Test Data', ()=> {
      cy.prepareData('video/sample.mp4', 1, ASSET_ID)
    })
    it('Add video asset to video show episode', () => {
      cy.visit(`/asset/${ASSET_ID}`)
      cy.api_waitPageLoad('asset-edit')
      // eslint-disable-next-line cypress/unsafe-to-chain-command
      cy.get('[data-cy="custom-field-title"] textarea')
        .first().clear({ force: true }).type(`${ASSET_TITLE}`)
      // eslint-disable-next-line cypress/unsafe-to-chain-command
      cy.get('[data-cy="custom-field-description"] textarea')
        .first().clear({ force: true }).type(`${ASSET_DESCRIPTION}`)
      cy.getCy('button-save').should('be.visible').click()
      cy.alertMessage(ALERT_UPDATE)
      cy.getCy('button-video-show').should('be.visible').click()
      cy.getCy('button-add-new-vs-episode').should('be.visible').click()
      cy.getCy('field-choose-video-show').click()
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(500)
      // eslint-disable-next-line cypress/unsafe-to-chain-command
      cy.get('.v-list-item').first().click()
      // eslint-disable-next-line cypress/unsafe-to-chain-command
      cy.getCy('field-title-episode').clear().type(`${VIDEO_SHOW_TITLE}-edit`)
      cy.getCy('button-add').should('be.visible').click()
      cy.alertMessage(ALERT_CREATE)
    })
    it('Delete podcast', ()=>{
      cy.visit(`/asset/${ASSET_ID}`)
      cy.api_waitPageLoad('asset-edit')
      cy.getCy('button-video-show').should('be.visible').click()
      cy.get('.text-body-2').contains(`${VIDEO_SHOW_TITLE}-edit`).should('exist')
      // todo until delete-videoshow-episode-button exist
      //cy.get('.text-body-2').eq(0).contains('Neimportované').should('exist')
      // cy.getCy('button-delete').first().should('be.visible').click()
      // cy.getCy('button-cancel').should('be.visible')
      // cy.getCy('button-close').should('be.visible')
      // cy.getCy('button-confirm-delete').should('be.visible').click()
      // cy.alertMessage(ALERT_UPDATE)
      // cy.get('.pa-4').should('contain', 'Nie je čo zobraziť');
    })
    it('Delete Test data', ()=>{
      cy.deleteFile(ASSET_ID)
    })
  })
