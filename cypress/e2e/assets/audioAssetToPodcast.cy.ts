/// <reference types="cypress" />

import {
  ALERT_UPDATE,
  CY,
  ASSET_TITLE,
  ASSET_DESCRIPTION,
  ALERT_CREATE, RAND_NUM
} from '../../utils/common'
const assetIDs: Array<string> = []

describe(`Test add audio asset to podcast episode function, Env: ${CY.cfg}`,
  { tags: ['@assetAudioToPodcast', '@assets'] }, () => {
    it('Prepare Test Data', ()=> {
      cy.prepareData('audio/sample.mp3', true, assetIDs)
    })
    it('Add audio asset to podcast episode', () => {
      cy.visit(`/asset/${assetIDs}`)
      cy.api_waitPageLoad('asset-edit')
      cy.get('[data-cy="custom-field-title"] textarea')
        .first().clear({ force: true }).type(`${ASSET_TITLE}`)
      cy.get('[data-cy="custom-field-description"] textarea')
        .first().clear({ force: true }).type(`${ASSET_DESCRIPTION}`)
      cy.getCy('button-save').last().should('be.visible').click()
      cy.alertMessage(ALERT_UPDATE)
      cy.getCy('button-podcast').should('be.visible').click()
      cy.getCy('button-add-new-podcast-episode').should('be.visible').click()
      cy.getCy('field-choose-podcast').click()
      cy.waitSec(1)
      cy.get('.v-list-item').eq(0).click()
      cy.getCy('field-title-podcast').clear().type(`${ASSET_TITLE}-edit`)
      cy.getCy('field-description-podcast').clear().type(`${ASSET_DESCRIPTION}-edit`)
      cy.getCy('field-season-num-podcast').clear().type( `${RAND_NUM}`)
      cy.getCy('field-episode-num-podcast').clear().type(`${RAND_NUM}`)
      cy.getCy('button-add').should('be.visible').click()
      cy.alertMessage(ALERT_CREATE)
    })
    it('Delete podcast', ()=>{
      cy.visit(`/asset/${assetIDs}`)
      cy.api_waitPageLoad('asset-edit')
      cy.getCy('button-podcast').should('be.visible').click()
      cy.get('.text-body-2').contains(`${ASSET_TITLE}-edit`).should('exist')
      cy.getCy('button-delete').first().should('be.visible').click()
      cy.getCy('button-cancel').should('be.visible')
      cy.getCy('button-close').should('be.visible')
      cy.getCy('button-confirm-delete').should('be.visible').click()
      cy.get('.pa-4').should('contain', 'Nie je čo zobraziť')
      cy.getCy('button-slots').click()
      cy.getCy('button-podcast').click()
      cy.get('.pa-4').should('contain', 'Nie je čo zobraziť')
    })
    it('Delete Test data', ()=>{
      cy.deleteFile(assetIDs)
    })
})
