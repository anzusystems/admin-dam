/// <reference types="cypress" />

import { ALERT_UPDATE, CY, ASSET_TITLE, ASSET_DESCRIPTION } from '../../utils/common'
const assetIDs: Array<string> = []

describe(`Test asset document function, Env: ${CY.cfg}`,
  { tags: ['@assetDocument', '@assets'] }, () => {
    it('Prepare Test Data', ()=> {
      cy.prepareData('document/sample.doc', true, assetIDs)
    })
    it('Create Metadata', ()=> {
      cy.visit(`/asset/${assetIDs}`)
      cy.api_waitPageLoad('asset-edit')
      cy.get('[data-cy="custom-field-title"] textarea')
        .first().clear({ force: true }).type(`${ASSET_TITLE}`)
      cy.get('[data-cy="custom-field-description"] textarea')
        .first().clear({ force: true }).type(`${ASSET_DESCRIPTION}`)
      cy.getCy('button-delete').click()
      cy.getCy('button-confirm-delete').should('be.visible')
      cy.getCy('button-close').should('be.visible')
      cy.getCy('button-cancel').click()
      cy.getCy('button-download').should('be.visible').click()
      cy.getCy('button-download-file').should('be.visible')
      cy.getCy('button-close').should('be.visible')
      cy.getCy('button-cancel').click()
      cy.getCy('button-save').last().should('be.visible').click()
      cy.alertMessage(ALERT_UPDATE)
    })
    it('Edit Metadata', ()=> {
      cy.visit(`/asset/${assetIDs}`)
      cy.api_waitPageLoad('asset-edit')
      cy.get('[data-cy="custom-field-title"] textarea')
        .first().clear({ force: true }).type(`${ASSET_TITLE}-edit`)
      cy.get('[data-cy="custom-field-description"] textarea')
        .first().clear({ force: true }).type(`${ASSET_DESCRIPTION}`)
      cy.getCy('button-save').last().should('be.visible').click()
      cy.alertMessage(ALERT_UPDATE)
    })
    it('Clear Metadata', ()=> {
      cy.visit(`/asset/${assetIDs}`)
      cy.api_waitPageLoad('asset-edit')
      cy.get('[data-cy="custom-field-title"] textarea')
        .first().clear({ force: true })
      cy.get('[data-cy="custom-field-description"] textarea')
        .first().clear({ force: true })
      cy.getCy('button-save').last().should('be.visible').click()
      cy.alertMessage(ALERT_UPDATE)
      cy.getCy('button-slots').should('be.visible')
    })
    it('Delete Test data', ()=>{
      cy.deleteFile(assetIDs)
    })
  })
