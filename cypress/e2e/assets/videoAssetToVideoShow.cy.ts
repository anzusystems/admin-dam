/// <reference types="cypress" />

import { ALERT_UPDATE, CY, ASSET_TITLE, ASSET_DESCRIPTION, ALERT_CREATE, VIDEO_SHOW_TITLE } from '../../utils/common'
const assetIDs: Array<string> = []

describe(`Test add video asset to video show episode  function, Env: ${CY.cfg}`,
  { tags: ['@assetVideoToVideoShow', '@assets'] }, () => {
    it('Prepare Test Data', ()=> {
      cy.prepareData('video/sample.mp4', true, assetIDs)
    })
    it('Add video asset to video show episode', () => {
      cy.visit(`/asset/${assetIDs}`)
      cy.api_waitPageLoad('asset-edit')
      cy.get('[data-cy="custom-field-title"] textarea')
        .first().clear({ force: true }).type(`${ASSET_TITLE}`)
      cy.get('[data-cy="custom-field-description"] textarea')
        .first().clear({ force: true }).type(`${ASSET_DESCRIPTION}`)
      cy.getCy('button-save').last().should('be.visible').click()
      cy.alertMessage(ALERT_UPDATE)
      cy.getCy('button-video-show').should('be.visible').click()
      cy.getCy('button-add-new-vs-episode').should('be.visible').click()
      cy.getCy('field-choose-video-show').click()
      cy.waitSec(1)
      cy.get('.v-list-item').first().click()
      cy.getCy('field-title-episode').clear().type(`${VIDEO_SHOW_TITLE}-edit`)
      cy.getCy('button-add').should('be.visible').click()
      cy.alertMessage(ALERT_CREATE)
    })
    it('Delete video-show episode', ()=>{
      cy.visit(`/asset/${assetIDs}`)
      cy.api_waitPageLoad('asset-edit')
      cy.getCy('button-video-show').should('be.visible').click()
      cy.get('.text-body-2').contains(`${VIDEO_SHOW_TITLE}-edit`).should('exist')
    })
    it('Delete Test data', ()=>{
      cy.deleteFile(assetIDs)
    })
  })
