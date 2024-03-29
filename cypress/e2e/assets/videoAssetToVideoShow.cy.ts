/// <reference types="cypress" />

import { ALERT_UPDATE, CY, ASSET_TITLE, ASSET_DESCRIPTION, ALERT_CREATE, VIDEO_SHOW_TITLE } from '../../utils/common'
const ASSET_ID: Array<string> = []

describe(`Test add video asset to video show episode  function, Env: ${CY.cfg}`,
  { tags: '@assetVideoToVideoShow' }, () => {
    it('Prepare Test Data', ()=> {
      cy.prepareData('video/sample.mp4', true, ASSET_ID)
    })
    it('Add video asset to video show episode', () => {
      cy.visit(`/asset/${ASSET_ID}`)
      cy.api_waitPageLoad('asset-edit')
      cy.get('[data-cy="custom-field-title"] textarea')
        .first().clear({ force: true }).type(`${ASSET_TITLE}`)
      cy.get('[data-cy="custom-field-description"] textarea')
        .first().clear({ force: true }).type(`${ASSET_DESCRIPTION}`)
      cy.getCy('button-save').should('be.visible').click()
      cy.alertMessage(ALERT_UPDATE)
      cy.getCy('button-video-show').should('be.visible').click()
      cy.getCy('button-add-new-vs-episode').should('be.visible').click()
      cy.getCy('field-choose-video-show').click()
      cy.wait(500)
      cy.get('.v-list-item').first().click()
      cy.getCy('field-title-episode').clear().type(`${VIDEO_SHOW_TITLE}-edit`)
      cy.getCy('button-add').should('be.visible').click()
      cy.alertMessage(ALERT_CREATE)
    })
    it('Delete video-show episode', ()=>{
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
