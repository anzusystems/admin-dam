/// <reference types="cypress" />

import {
  ALERT_UPDATE, CY, ASSET_TITLE, ASSET_DESCRIPTION, KEYWORDS, AUTHORS } from '../../utils/common'
const ASSET_ID: Array<string> = []

describe(`Test asset image function, Env: ${CY.cfg}`,
  { tags: '@assetImage' }, () => {
    it('Prepare Test Data', ()=> {
      cy.prepareData('image/sample.png', 1, ASSET_ID)
    })
    it('Create Metadata', ()=> {
      cy.visit(`/asset/${ASSET_ID}`)
      cy.api_waitPageLoad('asset-edit')
      cy.getCy('button-more-metadata').click()
      // eslint-disable-next-line cypress/unsafe-to-chain-command
      cy.get('[data-cy="custom-field-title"] textarea')
        .first().clear({ force: true }).type(`${ASSET_TITLE}`)
      // eslint-disable-next-line cypress/unsafe-to-chain-command
      cy.get('[data-cy="custom-field-description"] textarea')
        .first().clear({ force: true }).type(`${ASSET_DESCRIPTION}`)
      KEYWORDS.forEach(keyword=> {
        cy.get('body').click()
        cy.get('[data-cy="custom-field-keywords"] input').type(`${keyword}`)
        cy.contains('.v-list-item', `${keyword}`, { timeout: 6000 }).click()
      })
      cy.get('body').type('{esc}')
      AUTHORS.forEach(author => {
        cy.get('body').click()
        cy.get('[data-cy="custom-field-authors"] input').type(`${author}`)
        cy.contains('.v-list-item', `${author}`, { timeout: 6000 }).click()
      })
      cy.get('body').type('{esc}')
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
    it('Edit Metadata', ()=> {
      cy.visit(`/asset/${ASSET_ID}`)
      cy.api_waitPageLoad('asset-edit')
      cy.getCy('button-more-metadata').click()
      // eslint-disable-next-line cypress/unsafe-to-chain-command
      cy.get('[data-cy="custom-field-title"] textarea')
        .first().clear({ force: true }).type(`${ASSET_TITLE}-edit`)
      // eslint-disable-next-line cypress/unsafe-to-chain-command
      cy.get('[data-cy="custom-field-description"] textarea')
        .first().clear({ force: true }).type(`${ASSET_DESCRIPTION}-edit`)
      cy.get('[data-cy="custom-field-keywords"] .mdi-close-circle').click()
      cy.get('[data-cy="custom-field-keywords"] input').type(`${KEYWORDS[0]}`)
      cy.contains('.v-list-item', `${KEYWORDS[0]}`, { timeout: 6000 }).click()
      cy.get('body').type('{esc}')
      cy.get('[data-cy="custom-field-authors"] .mdi-close-circle').click()
      cy.get('[data-cy="custom-field-authors"] input').type(`${AUTHORS[0]}`)
      cy.contains('.v-list-item', `${AUTHORS[0]}`, { timeout: 6000 }).click()
      cy.get('body').type('{esc}')
      cy.getCy('button-save').should('be.visible').click()
      cy.alertMessage(ALERT_UPDATE)
    })
    it('Clear Metadata', ()=> {
      cy.visit(`/asset/${ASSET_ID}`)
      cy.api_waitPageLoad('asset-edit')
      cy.getCy('button-more-metadata').click()
      cy.get('[data-cy="custom-field-title"] textarea')
        .first().clear({ force: true })
      cy.get('[data-cy="custom-field-description"] textarea')
        .first().clear({ force: true })
      cy.get('[data-cy="custom-field-mediaApiIds"] input').clear()
      cy.get('[data-cy="custom-field-keywords"] .mdi-close-circle').click()
      cy.get('[data-cy="custom-field-authors"] .mdi-close-circle').click()
      cy.get('[data-cy="custom-field-mediaApiPaths"] input').clear()
      cy.getCy('button-save').should('be.visible').click()
      cy.alertMessage(ALERT_UPDATE)
      cy.getCy('button-meta').should('be.visible')
      cy.getCy('button-focus').should('be.visible')
      cy.getCy('button-slots').should('be.visible')
    })
    it('Test Focus', ()=> {
      cy.visit(`/asset/${ASSET_ID}`)
      cy.api_waitPageLoad('asset-edit')
      cy.getCy('button-focus').click()
      cy.getCy('button-rotate-right').should('be.visible').click()
      cy.alertMessage(ALERT_UPDATE)
      cy.getCy('button-rotate-left').should('be.visible').click()
      cy.alertMessage(ALERT_UPDATE)
    })
    it('Delete Test data', ()=>{
      cy.deleteFile(ASSET_ID)
    })
  })
