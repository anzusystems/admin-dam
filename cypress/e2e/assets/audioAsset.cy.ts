/// <reference types="cypress" />

import { ALERT_UPDATE, CY, ASSET_TITLE, ASSET_DESCRIPTION, RAND_NUM } from '../../utils/common'
const ASSET_ID: Array<string> = []

describe(`Test asset audio function, Env: ${CY.cfg}`,
  { tags: ['@assetAudio', '@assets'] }, () => {
    it('Prepare Test Data', ()=> {
      cy.prepareData('audio/sample.mp3',1, ASSET_ID)
    })
    it('Create Metadata', () => {
      cy.visit(`/asset/${ASSET_ID}`)
      cy.api_waitPageLoad('asset-edit')
      // eslint-disable-next-line cypress/unsafe-to-chain-command
      cy.get('[data-cy="custom-field-title"] textarea')
        .first().clear({ force: true }).type(`${ASSET_TITLE}`)
      // eslint-disable-next-line cypress/unsafe-to-chain-command
      cy.get('[data-cy="custom-field-description"] textarea')
        .first().clear({ force: true }).type(`${ASSET_DESCRIPTION}`)
      cy.getCy('add-keyword').click()
      cy.getCy('keyword-name').type(`Keyword${RAND_NUM}`)
      cy.getCy('button-confirm').click()
      cy.get('[data-cy="custom-field-keywords"] input').type(`Keyword${RAND_NUM}`)
      // eslint-disable-next-line cypress/unsafe-to-chain-command
      cy.get('body').click()
      cy.getCy('add-author').click()
      cy.getCy('author-name').type(`Author${RAND_NUM}`)
      cy.getCy('button-confirm').click()
      cy.get('[data-cy="custom-field-authors"] input').type(`Author${RAND_NUM}`)
      // eslint-disable-next-line cypress/unsafe-to-chain-command
      cy.get('body').click()
      cy.getCy('button-delete').click()
      cy.getCy('button-confirm-delete').should('be.visible')
      cy.getCy('button-close').should('be.visible')
      cy.getCy('button-cancel').click()
      cy.getCy('button-download').should('be.visible').click()
      cy.getCy('button-download-file').should('be.visible')
      cy.getCy('button-close').should('be.visible')
      cy.getCy('button-cancel').click()
      cy.getCy('button-save').should('be.visible').click()
      cy.alertMessage(ALERT_UPDATE)
    })
    it('Edit Metadata', ()=>{
      cy.visit(`/asset/${ASSET_ID}`)
      cy.api_waitPageLoad('asset-edit')
      // eslint-disable-next-line cypress/unsafe-to-chain-command
      cy.get('[data-cy="custom-field-title"] textarea')
        .first().clear({ force: true }).type(`${ASSET_TITLE}-edit`)
      // eslint-disable-next-line cypress/unsafe-to-chain-command
      cy.get('[data-cy="custom-field-description"] textarea')
        .first().clear({ force: true }).type(`${ASSET_DESCRIPTION}`)
      cy.getCy('button-save').should('be.visible').click()
      cy.alertMessage(ALERT_UPDATE)
    })
    it('Clear Metadata', ()=>{
      cy.visit(`/asset/${ASSET_ID}`)
      cy.api_waitPageLoad('asset-edit')
      cy.get('[data-cy="custom-field-title"] textarea')
        .first().clear({ force: true })
      cy.get('[data-cy="custom-field-description"] textarea')
        .first().clear({ force: true })
      cy.get('[data-cy="custom-field-keywords"] .mdi-close-circle').click()
      cy.get('[data-cy="custom-field-authors"] .mdi-close-circle').click()
      cy.getCy('button-save').should('be.visible').click()
      cy.alertMessage(ALERT_UPDATE)
      cy.getCy('button-meta').should('be.visible')
      cy.getCy('button-distribution').should('be.visible')
      cy.getCy('button-podcast').should('be.visible')
      cy.getCy('button-slots').should('be.visible')
    })
    it('Delete Test data', ()=>{
      cy.deleteFile(ASSET_ID)
    })
})
